import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { InvalidReportingEventError, parseReportingEvent } from "@rct/portfolio-contracts";
import { emptyProjection, projectEvent } from "./projection.ts";

const fixtures: unknown[] = JSON.parse(
  readFileSync(new URL("../../contracts/fixtures/events.json", import.meta.url), "utf8"),
);
const lead = parseReportingEvent(fixtures[0]);

test("each domain contributes once even when delivery metadata changes on retry", () => {
  const empty = emptyProjection();
  const first = projectEvent(empty, lead);
  assert.equal(first.totals.get("consulting#2026-11#inboundLeads"), 1);
  assert.equal(empty.totals.size, 0);
  assert.equal(projectEvent(first, { ...lead, id: "00000000-0000-4000-8000-000000000099" }), first);
  const both = projectEvent(first, fixtures[1]);
  assert.equal(both.totals.get("dotcom#2026-11#mentorApprovals"), 1);
  assert.equal(both.processedEvents.size, 2);
});

test("reordered JSON keys are duplicates, but reused IDs with changed facts are errors", () => {
  const first = projectEvent(emptyProjection(), lead);
  const reordered = {
    ...lead,
    detail: { ...lead.detail, data: { leadCount: 1, reportingMonth: "2026-11" } },
  };
  assert.equal(projectEvent(first, reordered), first);
  assert.throws(() => projectEvent(first, {
    ...lead,
    detail: { ...lead.detail, data: { reportingMonth: "2026-10", leadCount: 1 } },
  }), /reused/);
  assert.equal(first.totals.get("consulting#2026-11#inboundLeads"), 1);
});

test("late corrections affect their reporting month and replay is order-independent", () => {
  let forward = emptyProjection();
  let reversed = emptyProjection();
  for (const event of fixtures) forward = projectEvent(forward, event);
  for (const event of [...fixtures].reverse()) reversed = projectEvent(reversed, event);
  assert.deepEqual([...forward.totals].sort(), [...reversed.totals].sort());
  assert.equal(forward.totals.get("consulting#2026-11#inboundLeads"), 0);
  assert.equal(forward.totals.get("dotcom#2026-11#mentorApprovals"), 0);
  assert.equal(forward.latestOccurredAt, "2026-12-01T10:01:00.000Z");
  assert.equal(reversed.latestOccurredAt, forward.latestOccurredAt);
  for (const event of fixtures) forward = projectEvent(forward, event);
  assert.equal(forward.processedEvents.size, 4);
});

test("invalid events never change an existing projection", () => {
  const state = projectEvent(emptyProjection(), lead);
  assert.throws(() => projectEvent(state, {
    ...lead,
    detail: { ...lead.detail, data: { reportingMonth: "2026-11", leadCount: 1, email: "synthetic@example.invalid" } },
  }), /rejected/);
  assert.equal(state.processedEvents.size, 1);
  assert.equal(state.totals.get("consulting#2026-11#inboundLeads"), 1);
});

test("rejects unsupported leap seconds before replay and normalizes supported offsets", () => {
  const state = emptyProjection();
  assert.throws(() => projectEvent(state, {
    ...lead,
    detail: { ...lead.detail, occurredAt: "2016-12-31T23:59:60Z" },
  }), InvalidReportingEventError);
  assert.equal(state.processedEvents.size, 0);
  const result = projectEvent(state, {
    ...lead,
    detail: { ...lead.detail, occurredAt: "2017-01-01T01:00:00+01:00" },
  });
  assert.equal(result.latestOccurredAt, "2017-01-01T00:00:00.000Z");
});
