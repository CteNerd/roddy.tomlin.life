import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { SQSEvent, SQSRecord } from "aws-lambda";
import { prepareReportingEvent } from "@rct/portfolio-reporting";
import { createHandler } from "./handler.ts";

const fixtures: unknown[] = JSON.parse(readFileSync(new URL("../../../packages/contracts/fixtures/events.json", import.meta.url), "utf8"));
const lead = prepareReportingEvent(fixtures[0]).event;
const mentor = prepareReportingEvent(fixtures[1]).event;
const consulting = "arn:aws:sqs:us-east-1:123456789012:rct-portfolio-development-reporting-consulting";
const dotcom = "arn:aws:sqs:us-east-1:123456789012:rct-portfolio-development-reporting-dotcom";
const routes = new Map([[consulting, "rct.consulting"], [dotcom, "rct.dotcom"]] as const);

function message(id: string, event: unknown, queue = consulting): SQSRecord {
  return {
    messageId: id, receiptHandle: "synthetic", body: JSON.stringify(event),
    eventSource: "aws:sqs", eventSourceARN: queue, awsRegion: "us-east-1",
    attributes: { ApproximateReceiveCount: "1", SentTimestamp: "0", SenderId: "synthetic", ApproximateFirstReceiveTimestamp: "0" },
    messageAttributes: {}, md5OfBody: "synthetic",
  };
}
const delivery = (event: unknown) => ({
  ...prepareReportingEvent(event).event,
  version: "0", account: "123456789012", region: "us-east-1",
  id: "00000000-0000-4000-8000-000000000099", time: "2026-11-05T16:01:00Z",
});

test("partial batches isolate malformed/private events and never log payloads", async () => {
  const logs: unknown[] = [];
  let applied = 0;
  const handler = createHandler({
    apply: async (input) => { prepareReportingEvent(input); applied++; return "applied"; },
  }, routes, (failure) => logs.push(failure));
  const invalid = { ...delivery(lead), detail: { ...lead.detail, data: { ...lead.detail.data, email: "private@example.invalid" } } };
  const malformed = { ...message("syntax", delivery(lead)), body: "{private@example.invalid" };
  const batch: SQSEvent = { Records: [
    message("good", delivery(lead)), message("private", invalid), malformed, message("mentor", delivery(mentor), dotcom),
  ] };
  assert.deepEqual(await handler(batch), { batchItemFailures: [{ itemIdentifier: "private" }, { itemIdentifier: "syntax" }] });
  assert.equal(applied, 2);
  assert.doesNotMatch(JSON.stringify(logs), /private@example|reportingMonth|correlationId/);
});

test("unapproved queues, account/region and cross-source envelopes never reach storage", async () => {
  let calls = 0;
  const handler = createHandler({ apply: async () => { calls++; return "applied"; } }, routes, () => {});
  const records = [
    message("source", delivery(mentor)),
    message("queue", delivery(lead), consulting.replace("development", "production")),
    message("account", { ...delivery(lead), account: "999999999999" }),
    message("region", { ...delivery(lead), region: "us-west-2" }),
  ];
  assert.deepEqual(await handler({ Records: records }), { batchItemFailures: records.map((record) => ({ itemIdentifier: record.messageId })) });
  assert.equal(calls, 0);
});

test("storage outages report only failed messages and do not suppress later successes or leak error details", async () => {
  const logs: unknown[] = [];
  const handler = createHandler({ apply: async (input) => {
    if (prepareReportingEvent(input).event.source === "rct.consulting") throw new Error("private secret payload");
    return "applied";
  } }, routes, (failure) => logs.push(failure));
  assert.deepEqual(await handler({ Records: [
    message("retry", delivery(lead)), message("success", delivery(mentor), dotcom),
  ] }), { batchItemFailures: [{ itemIdentifier: "retry" }] });
  assert.doesNotMatch(JSON.stringify(logs), /private secret/);
  assert.match(JSON.stringify(logs), /storage_failure/);
});

test("queue configuration rejects missing domains or mixed accounts/environments", () => {
  const sink = { apply: async () => "applied" as const };
  assert.throws(() => createHandler(sink, new Map([[consulting, "rct.consulting"]])), /Both approved/);
  assert.throws(() => createHandler(sink, new Map([[consulting, "rct.consulting"], [dotcom.replace("development", "production"), "rct.dotcom"]])), /same account and environment/);
});
