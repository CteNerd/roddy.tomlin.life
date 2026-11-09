import { fetchMetrics } from "./metrics.js";

const rehearsalRows = {
  "2026-09": [{
    domain: "consulting",
    metric: "inboundLeads",
    total: 0,
    latestOccurredAt: "2026-09-18T14:22:00.000Z",
    processedAt: "2026-09-18T14:23:00.000Z",
  }],
  "2026-11": [
    {
      domain: "consulting",
      metric: "inboundLeads",
      total: 8,
      latestOccurredAt: "2026-11-06T16:00:00.000Z",
      processedAt: "2026-11-06T16:01:00.000Z",
    },
    {
      domain: "dotcom",
      metric: "mentorApprovals",
      total: -1,
      latestOccurredAt: "2026-11-07T10:00:00.000Z",
      processedAt: "2026-11-07T10:01:00.000Z",
    },
  ],
};

function rehearsalResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  };
}

export async function loadRehearsalMetrics({ month, scenario, signal }) {
  if (signal.aborted) throw new DOMException("Request aborted", "AbortError");
  let response = rehearsalResponse(200, {
    month,
    metrics: scenario === "timeline" ? (rehearsalRows[month] ?? []) : [],
  });

  if (scenario === "expired") {
    response = rehearsalResponse(401, {});
  } else if (scenario === "error") {
    response = rehearsalResponse(503, {});
  } else if (scenario === "malformed") {
    response = rehearsalResponse(200, {
      month,
      metrics: [{
        domain: "consulting",
        metric: "inboundLeads",
        total: "8",
        latestOccurredAt: "2026-11-06T16:00:00.000Z",
        processedAt: "2026-11-06T16:01:00.000Z",
      }],
    });
  }

  return fetchMetrics({
    apiUrl: "http://127.0.0.1",
    accessToken: "synthetic-local-rehearsal",
    month,
    signal,
    fetchImpl: async () => response,
  });
}
