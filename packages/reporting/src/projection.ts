import { createHash } from "node:crypto";
import { parseReportingEvent, type ReportingEvent } from "@rct/portfolio-contracts";

export type ProjectionState = {
  readonly totals: ReadonlyMap<string, number>;
  readonly processedEvents: ReadonlyMap<string, string>;
  readonly latestOccurredAt: string | null;
};

export function emptyProjection(): ProjectionState {
  return { totals: new Map(), processedEvents: new Map(), latestOccurredAt: null };
}

function contribution(event: ReportingEvent) {
  switch (event["detail-type"]) {
    case "consulting.lead.created.v1":
      return { metric: "inboundLeads", delta: event.detail.data.leadCount };
    case "consulting.lead.count.adjusted.v1":
      return { metric: "inboundLeads", delta: event.detail.data.countDelta };
    case "dotcom.mentor.approved.v1":
      return { metric: "mentorApprovals", delta: event.detail.data.mentorCount };
    case "dotcom.mentor.approval.count.adjusted.v1":
      return { metric: "mentorApprovals", delta: event.detail.data.countDelta };
  }
}

function fingerprint(event: ReportingEvent): string {
  const detail = event.detail;
  const canonical = [
    event.source, event["detail-type"], detail.eventId, detail.schemaVersion,
    detail.occurredAt, detail.correlationId, detail.domain,
    Object.entries(detail.data).sort(([a], [b]) => a.localeCompare(b)),
  ];
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function projectEvent(state: ProjectionState, input: unknown): ProjectionState {
  const event = parseReportingEvent(input);
  const hash = fingerprint(event);
  const existing = state.processedEvents.get(event.detail.eventId);
  if (existing !== undefined) {
    if (existing !== hash) throw new Error("Immutable reporting event ID was reused with different content");
    return state;
  }
  const { metric, delta } = contribution(event);
  const key = `${event.detail.domain}#${event.detail.data.reportingMonth}#${metric}`;
  const totals = new Map(state.totals);
  const total = (totals.get(key) ?? 0) + delta;
  if (!Number.isSafeInteger(total)) throw new Error("Reporting total exceeds safe integer precision");
  totals.set(key, total);
  const processedEvents = new Map(state.processedEvents);
  processedEvents.set(event.detail.eventId, hash);
  const occurredAt = new Date(event.detail.occurredAt).toISOString();
  return {
    totals,
    processedEvents,
    latestOccurredAt: state.latestOccurredAt === null || occurredAt > state.latestOccurredAt
      ? occurredAt : state.latestOccurredAt,
  };
}
