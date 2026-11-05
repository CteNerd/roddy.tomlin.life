import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { TransactionCanceledException } from "@aws-sdk/client-dynamodb";
import type { TransactWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import { InvalidReportingEventError, parseReportingEvent } from "@rct/portfolio-contracts";
import { prepareReportingEvent } from "@rct/portfolio-reporting";
import { DynamoReportingStore, ImmutableEventConflict, ReportingContentionError, ReportingIntegrityError, type ReportingTransport } from "./store.ts";

const fixtures: unknown[] = JSON.parse(readFileSync(new URL("../../../packages/contracts/fixtures/events.json", import.meta.url), "utf8"));
const lead = parseReportingEvent(fixtures[0]);
const prepared = prepareReportingEvent(lead);
const receipt = { PK: `EVENT#${lead.detail.eventId}`, SK: "RECEIPT", fingerprint: prepared.fingerprint };
const projection = {
  PK: "MONTH#2026-11", SK: "consulting#inboundLeads", total: 2, version: 1,
  latestOccurredAt: prepared.occurredAt, updatedAt: prepared.occurredAt,
};
const conflict = (receiptConflict = false) => new TransactionCanceledException({
  $metadata: {}, message: "Synthetic condition conflict",
  CancellationReasons: receiptConflict ? [{ Code: "ConditionalCheckFailed" }, { Code: "None" }]
    : [{ Code: "None" }, { Code: "ConditionalCheckFailed" }],
});

test("invalid or identity-bearing payloads never reach storage", async () => {
  let calls = 0;
  const transport: ReportingTransport = {
    get: async () => { calls++; return {}; },
    transact: async () => { calls++; },
  };
  const store = new DynamoReportingStore("reporting-test", transport);
  await assert.rejects(() => store.apply({ ...lead, detail: {
    ...lead.detail, data: { ...lead.detail.data, email: "private@example.invalid" },
  } }), InvalidReportingEventError);
  assert.equal(calls, 0);
});

test("matching receipts acknowledge duplicates while reused IDs with changed facts are errors", async () => {
  let writes = 0;
  const store = new DynamoReportingStore("reporting-test", {
    get: async (request) => { assert.equal(request.ConsistentRead, true); return { Item: receipt }; },
    transact: async () => { writes++; },
  });
  assert.equal(await store.apply(lead), "duplicate");
  await assert.rejects(() => store.apply({ ...lead, detail: {
    ...lead.detail, data: { ...lead.detail.data, reportingMonth: "2026-10" },
  } }), ImmutableEventConflict);
  assert.equal(writes, 0);
});

test("optimistic conflicts reread state and atomically pair receipt creation with a versioned projection", async () => {
  const writes: TransactWriteCommandInput[] = [];
  let reads = 0;
  const store = new DynamoReportingStore("reporting-test", {
    get: async () => { reads++; return reads === 4 ? { Item: projection } : {}; },
    transact: async (request) => {
      writes.push(request);
      if (writes.length === 1) throw conflict();
    },
  });
  assert.equal(await store.apply(lead), "applied");
  assert.equal(writes.length, 2);
  assert.equal(writes[1]?.TransactItems?.length, 2);
  assert.equal(writes[1]?.TransactItems?.[0]?.Put?.ConditionExpression, "attribute_not_exists(PK)");
  assert.equal(writes[1]?.TransactItems?.[1]?.Put?.Item?.total, 3);
  assert.deepEqual(writes[1]?.TransactItems?.[1]?.Put?.ExpressionAttributeValues, { ":expected": 1 });
});

test("a concurrent duplicate succeeds only after a matching committed receipt is observed", async () => {
  let reads = 0;
  let writes = 0;
  const store = new DynamoReportingStore("reporting-test", {
    get: async () => (++reads === 3 ? { Item: receipt } : {}),
    transact: async () => { writes++; throw conflict(true); },
  });
  assert.equal(await store.apply(lead), "duplicate");
  assert.equal(writes, 1);
});

test("contention retries are bounded, and non-conditional storage errors are never hidden", async () => {
  let writes = 0;
  const store = new DynamoReportingStore("reporting-test", {
    get: async () => ({}), transact: async () => { writes++; throw conflict(); },
  });
  await assert.rejects(() => store.apply(lead), ReportingContentionError);
  assert.equal(writes, 5);
  const unavailable = new Error("Synthetic storage outage");
  const broken = new DynamoReportingStore("reporting-test", {
    get: async () => ({}), transact: async () => { throw unavailable; },
  });
  await assert.rejects(() => broken.apply(lead), (error) => error === unavailable);
});

test("corrupt records, unsafe counters and version overflow never commit a receipt", async () => {
  for (const row of [
    { ...receipt, fingerprint: "invalid" },
    { ...projection, total: "2" }, { ...projection, version: 0 },
    { ...projection, total: Number.MAX_SAFE_INTEGER }, { ...projection, version: Number.MAX_SAFE_INTEGER },
    { ...projection, latestOccurredAt: "invalid" },
  ]) {
    let writes = 0;
    const store = new DynamoReportingStore("reporting-test", {
      get: async (request) => (request.Key?.PK === row.PK ? { Item: row } : {}),
      transact: async () => { writes++; },
    });
    await assert.rejects(() => store.apply(lead), ReportingIntegrityError);
    assert.equal(writes, 0);
  }
});

test("latest persisted fact time compares instants across extended-year normalization", async () => {
  const writes: TransactWriteCommandInput[] = [];
  const later = "+010000-01-01T00:59:59.000Z";
  const store = new DynamoReportingStore("reporting-test", {
    get: async (request) => (request.Key?.PK === projection.PK
      ? { Item: { ...projection, latestOccurredAt: later } } : {}),
    transact: async (request) => { writes.push(request); },
  });
  await store.apply({ ...lead, detail: { ...lead.detail, occurredAt: "9999-12-31T23:00:00Z" } });
  assert.equal(writes[0]?.TransactItems?.[1]?.Put?.Item?.latestOccurredAt, later);
});
