import { TransactionCanceledException } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient, GetCommand, TransactWriteCommand,
  type GetCommandInput, type GetCommandOutput, type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { prepareReportingEvent } from "@rct/portfolio-reporting";

export class ImmutableEventConflict extends Error {
  constructor() { super("Immutable reporting event ID was reused"); this.name = "ImmutableEventConflict"; }
}

export class ReportingIntegrityError extends Error {
  constructor() { super("Reporting storage failed integrity validation"); this.name = "ReportingIntegrityError"; }
}

export class ReportingContentionError extends Error {
  constructor() { super("Reporting transaction contention requires retry"); this.name = "ReportingContentionError"; }
}

export type ReportingTransport = {
  get(input: GetCommandInput): Promise<Pick<GetCommandOutput, "Item">>;
  transact(input: TransactWriteCommandInput): Promise<void>;
};

export function dynamoTransport(client: DynamoDBDocumentClient): ReportingTransport {
  return {
    get: (input) => client.send(new GetCommand(input)),
    transact: async (input) => { await client.send(new TransactWriteCommand(input)); },
  };
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function canonicalInstant(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value;
}

function conditionalFailure(error: unknown): boolean {
  return error instanceof TransactionCanceledException
    && error.CancellationReasons?.length === 2
    && error.CancellationReasons.some((reason) => reason.Code === "ConditionalCheckFailed")
    && error.CancellationReasons.every((reason) => reason.Code === "None" || reason.Code === "ConditionalCheckFailed");
}

export class DynamoReportingStore {
  private readonly table: string;
  private readonly transport: ReportingTransport;

  constructor(table: string, transport: ReportingTransport) {
    if (!/^[A-Za-z0-9._-]{3,255}$/.test(table)) throw new Error("An explicit reporting table name is required");
    this.table = table;
    this.transport = transport;
  }

  async apply(input: unknown): Promise<"applied" | "duplicate"> {
    const prepared = prepareReportingEvent(input);
    const { event, fingerprint, delta, metric, occurredAt } = prepared;
    const receiptKey = { PK: `EVENT#${event.detail.eventId}`, SK: "RECEIPT" };
    const projectionKey = { PK: `MONTH#${event.detail.data.reportingMonth}`, SK: `${event.detail.domain}#${metric}` };
    const receiptExists = async () => {
      const { Item: item } = await this.transport.get({ TableName: this.table, Key: receiptKey, ConsistentRead: true });
      if (item === undefined) return false;
      if (!object(item) || item.PK !== receiptKey.PK || item.SK !== receiptKey.SK
        || typeof item.fingerprint !== "string" || !/^[a-f0-9]{64}$/.test(item.fingerprint)) {
        throw new ReportingIntegrityError();
      }
      if (item.fingerprint !== fingerprint) throw new ImmutableEventConflict();
      return true;
    };
    if (await receiptExists()) return "duplicate";
    for (let attempt = 0; attempt < 5; attempt++) {
      const { Item: row } = await this.transport.get({ TableName: this.table, Key: projectionKey, ConsistentRead: true });
      if (row !== undefined && (!object(row) || row.PK !== projectionKey.PK || row.SK !== projectionKey.SK
        || typeof row.total !== "number" || !Number.isSafeInteger(row.total)
        || typeof row.version !== "number" || !Number.isSafeInteger(row.version) || row.version < 1
        || !canonicalInstant(row.latestOccurredAt))) {
        throw new ReportingIntegrityError();
      }
      const previousTotal: unknown = row?.total;
      const previousVersion: unknown = row?.version;
      const previousTime: unknown = row?.latestOccurredAt;
      const total = (typeof previousTotal === "number" ? previousTotal : 0) + delta;
      const version = (typeof previousVersion === "number" ? previousVersion : 0) + 1;
      if (!Number.isSafeInteger(total) || !Number.isSafeInteger(version)) throw new ReportingIntegrityError();
      const latestOccurredAt = typeof previousTime === "string" && Date.parse(previousTime) > Date.parse(occurredAt)
        ? previousTime : occurredAt;
      const updatedAt = new Date().toISOString();
      try {
        await this.transport.transact({
          TransactItems: [
            { Put: {
              TableName: this.table, Item: {
                ...receiptKey, fingerprint, source: event.source,
                detailType: event["detail-type"], occurredAt, receivedAt: updatedAt,
              },
              ConditionExpression: "attribute_not_exists(PK)",
            } },
            { Put: {
              TableName: this.table,
              Item: { ...projectionKey, total, version, latestOccurredAt, updatedAt },
              ...(row === undefined ? { ConditionExpression: "attribute_not_exists(PK)" } : {
                ConditionExpression: "#version = :expected",
                ExpressionAttributeNames: { "#version": "version" },
                ExpressionAttributeValues: { ":expected": previousVersion },
              }),
            } },
          ],
        });
        return "applied";
      } catch (error) {
        if (!conditionalFailure(error)) throw error;
        if (await receiptExists()) return "duplicate";
      }
    }
    throw new ReportingContentionError();
  }
}
