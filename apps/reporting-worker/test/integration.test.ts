import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  CreateTableCommand, DeleteTableCommand, DynamoDBClient, TransactionCanceledException, waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { parseReportingEvent } from "@rct/portfolio-contracts";
import { emptyProjection, projectEvent } from "@rct/portfolio-reporting";
import { DynamoReportingStore, dynamoTransport, ImmutableEventConflict, ReportingContentionError } from "../src/store.ts";
import { createProjectionReader } from "../../api/src/projections.ts";
import { parseStoredProjection } from "@rct/portfolio-reporting/stored-projection";

const endpoint = process.env.DYNAMODB_ENDPOINT;
if (!endpoint) throw new Error("DYNAMODB_ENDPOINT is mandatory; integration tests cannot be skipped");
const url = new URL(endpoint);
if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
  || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
  throw new Error("Integration tests require an explicit loopback-only DynamoDB Local endpoint");
}
const fixtures: unknown[] = JSON.parse(readFileSync(new URL("../../../packages/contracts/fixtures/events.json", import.meta.url), "utf8"));
const lead = parseReportingEvent(fixtures[0]);
const correction = parseReportingEvent(fixtures[2]);

test("real DynamoDB transactions preserve exactly-once totals across replay, contention and acknowledgement loss", async (t) => {
  const client = new DynamoDBClient({
    endpoint: url.href, region: "us-east-1",
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  });
  const document = DynamoDBDocumentClient.from(client);
  const table = `rct-reporting-integration-${randomUUID()}`;
  await client.send(new CreateTableCommand({
    TableName: table, BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: [{ AttributeName: "PK", AttributeType: "S" }, { AttributeName: "SK", AttributeType: "S" }],
    KeySchema: [{ AttributeName: "PK", KeyType: "HASH" }, { AttributeName: "SK", KeyType: "RANGE" }],
  }));
  t.after(async () => { try { await client.send(new DeleteTableCommand({ TableName: table })); } finally { client.destroy(); } });
  await waitUntilTableExists({ client, maxWaitTime: 30, minDelay: 1 }, { TableName: table });
  const transport = dynamoTransport(document);
  const store = new DynamoReportingStore(table, transport);
  const event = (month: string) => ({ ...lead, detail: {
    ...lead.detail, eventId: randomUUID(), data: { ...lead.detail.data, reportingMonth: month },
  } });
  const total = async (month: string) => (await document.send(new GetCommand({
    TableName: table, Key: { PK: `MONTH#${month}`, SK: "consulting#inboundLeads" }, ConsistentRead: true,
  }))).Item;

  await t.test("duplicates and changed delivery metadata cannot increment twice; changed facts fail", async () => {
    const input = event("2026-01");
    assert.equal(await store.apply(input), "applied");
    assert.equal(await store.apply({ ...input, account: "123456789012", region: "us-east-1" }), "duplicate");
    await assert.rejects(() => store.apply({ ...input, detail: {
      ...input.detail, data: { ...input.detail.data, reportingMonth: "2026-02" },
    } }), ImmutableEventConflict);
    assert.equal((await total("2026-01"))?.total, 1);
    assert.equal(await total("2026-02"), undefined);
  });

  await t.test("a lost acknowledgement after a real commit redelivers without another contribution", async () => {
    const input = event("2026-03");
    const lostAcknowledgement = new Error("Synthetic response loss after commit");
    const ambiguous = new DynamoReportingStore(table, {
      get: transport.get,
      transact: async (request) => { await transport.transact(request); throw lostAcknowledgement; },
    });
    await assert.rejects(() => ambiguous.apply(input), (error) => error === lostAcknowledgement);
    assert.equal(await store.apply(input), "duplicate");
    assert.equal((await total("2026-03"))?.total, 1);
    assert.equal((await total("2026-03"))?.version, 1);
  });

  await t.test("concurrent unique facts converge after bounded retry/redelivery without lost increments", async () => {
    const inputs = Array.from({ length: 8 }, () => event("2026-04"));
    const results = await Promise.allSettled(inputs.map((input) => store.apply(input)));
    for (const [index, result] of results.entries()) {
      if (result.status === "rejected") {
        assert.ok(result.reason instanceof ReportingContentionError || (result.reason instanceof TransactionCanceledException
          && result.reason.CancellationReasons?.some((reason) => ["ConditionalCheckFailed", "TransactionConflict"].includes(reason.Code ?? ""))));
        await store.apply(inputs[index]);
      }
    }
    for (const input of inputs) assert.equal(await store.apply(input), "duplicate");
    assert.equal((await total("2026-04"))?.total, inputs.length);
    assert.equal((await total("2026-04"))?.version, inputs.length);
  });

  await t.test("correction-first and creation-first delivery match the reference reducer, including latest fact time", async () => {
    for (const [month, reverse] of [["2026-05", false], ["2026-06", true]] as const) {
      const created = event(month);
      const adjusted = { ...correction, detail: {
        ...correction.detail, eventId: randomUUID(), data: { ...correction.detail.data, reportingMonth: month },
      } };
      const order = reverse ? [created, adjusted] : [adjusted, created];
      let reference = emptyProjection();
      for (const input of order) { reference = projectEvent(reference, input); await store.apply(input); }
      assert.equal((await total(month))?.total, reference.totals.get(`consulting#${month}#inboundLeads`));
      assert.equal((await total(month))?.latestOccurredAt, reference.latestOccurredAt);
      assert.equal((await total(month))?.total, 0);
    }
  });

  await t.test("the read-only API query returns only its selected monthly projections and real empty results", async () => {
    const read = createProjectionReader(table, (input) => document.send(new QueryCommand(input)));
    const rows = await read("2026-03");
    assert.equal(rows.length, 1);
    assert.equal(parseStoredProjection(rows[0], "2026-03").total, 1);
    assert.deepEqual(await read("1999-01"), []);
    assert.ok(rows.every((row) => parseStoredProjection(row, "2026-03").PK.startsWith("MONTH#")));
  });
});
