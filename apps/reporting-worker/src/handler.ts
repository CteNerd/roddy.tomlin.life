import type { SQSEvent, SQSBatchResponse } from "aws-lambda";
import { InvalidReportingEventError, type ReportingEvent } from "@rct/portfolio-contracts";
import { DynamoReportingStore, ImmutableEventConflict, ReportingIntegrityError } from "./store.ts";

type Failure = { message: string; messageId: string; reason: "invalid_event" | "unapproved_delivery" | "immutable_conflict" | "storage_integrity" | "storage_failure" };

class UnapprovedDelivery extends Error {}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function createHandler(
  store: Pick<DynamoReportingStore, "apply">,
  routes: ReadonlyMap<string, ReportingEvent["source"]>,
  logFailure: (failure: Failure) => void = (failure) => console.error(JSON.stringify(failure)),
) {
  const approved = new Map<string, { source: ReportingEvent["source"]; account: string }>();
  let namespace: string | undefined;
  for (const [arn, source] of routes) {
    const match = /^arn:aws:sqs:us-east-1:([0-9]{12}):rct-portfolio-(development|production)-reporting-(consulting|dotcom)$/.exec(arn);
    if (!match?.[1] || !match[2] || !match[3] || source !== `rct.${match[3]}`) throw new Error("Invalid reporting queue/source configuration");
    const currentNamespace = `${match[1]}#${match[2]}`;
    if (namespace !== undefined && namespace !== currentNamespace) throw new Error("Reporting queues must share the same account and environment");
    namespace = currentNamespace;
    approved.set(arn, { source, account: match[1] });
  }
  if (approved.size !== 2) throw new Error("Both approved reporting queues are required");
  return async (batch: SQSEvent): Promise<SQSBatchResponse> => {
    const batchItemFailures: SQSBatchResponse["batchItemFailures"] = [];
    for (const record of batch.Records) {
      try {
        const route = approved.get(record.eventSourceARN);
        if (record.eventSource !== "aws:sqs" || !route) throw new UnapprovedDelivery();
        let input: unknown;
        try { input = JSON.parse(record.body); }
        catch (error) {
          if (error instanceof SyntaxError) throw new InvalidReportingEventError();
          throw error;
        }
        if (!object(input) || input.source !== route.source || input.account !== route.account
          || input.region !== "us-east-1" || input.version !== "0"
          || typeof input.id !== "string" || typeof input.time !== "string") throw new UnapprovedDelivery();
        await store.apply(input);
      } catch (error) {
        const reason = error instanceof InvalidReportingEventError ? "invalid_event"
          : error instanceof UnapprovedDelivery ? "unapproved_delivery"
          : error instanceof ImmutableEventConflict ? "immutable_conflict"
          : error instanceof ReportingIntegrityError ? "storage_integrity" : "storage_failure";
        logFailure({ message: "Reporting message failed; retry or DLQ handling required", messageId: record.messageId, reason });
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }
    return { batchItemFailures };
  };
}
