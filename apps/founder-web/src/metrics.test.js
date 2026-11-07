import { describe, expect, it, vi } from "vitest";
import { fetchMetrics } from "./metrics.js";

const options = {
  apiUrl: "https://api.example.com/",
  accessToken: "verified-access-token",
  month: "2026-11",
};

describe("Founder reporting requests", () => {
  it("requests only the selected month without caching and returns approved aggregates", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        month: "2026-11",
        metrics: [{
          domain: "consulting",
          metric: "inboundLeads",
          total: 3,
          latestOccurredAt: "2026-11-05T16:00:00.000Z",
          processedAt: "2026-11-05T16:01:00.000Z",
        }],
      }),
    }));

    const result = await fetchMetrics({ ...options, fetchImpl });
    const [url, request] = fetchImpl.mock.calls[0];
    expect(url.href).toBe("https://api.example.com/metrics?month=2026-11");
    expect(request.headers.authorization).toBe("Bearer verified-access-token");
    expect(request.cache).toBe("no-store");
    expect(result.metrics).toEqual([{
      key: "consulting#inboundLeads",
      label: "Consulting inbound leads",
      total: 3,
      latestOccurredAt: "2026-11-05T16:00:00.000Z",
      processedAt: "2026-11-05T16:01:00.000Z",
    }]);
  });

  it("preserves empty observations, accepts signed totals and rejects unknown or malformed rows", async () => {
    const emptyFetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ month: options.month, metrics: [] }) }));
    expect(await fetchMetrics({ ...options, fetchImpl: emptyFetch })).toEqual({ month: options.month, metrics: [] });

    const invalidFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        month: options.month,
        metrics: [{
          domain: "consulting",
          metric: "privateReceipts",
          total: 3,
          latestOccurredAt: "2026-11-05T16:00:00.000Z",
          processedAt: "2026-11-05T16:01:00.000Z",
        }],
      }),
    }));
    await expect(fetchMetrics({ ...options, fetchImpl: invalidFetch })).rejects.toThrow("reporting response is invalid");

    const negativeFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        month: options.month,
        metrics: [{
          domain: "consulting",
          metric: "inboundLeads",
          total: -1,
          latestOccurredAt: "2026-11-05T16:00:00.000Z",
          processedAt: "2026-11-05T16:01:00.000Z",
        }],
      }),
    }));
    const negativeResult = await fetchMetrics({ ...options, fetchImpl: negativeFetch });
    expect(negativeResult.metrics[0]?.total).toBe(-1);
  });

  it.each([
    [401, "Your session expired. Sign in again."],
    [403, "This account is not authorized to view Founder reports."],
  ])("turns an API denial (%i) into an explicit safe message", async (status, message) => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status }));
    await expect(fetchMetrics({ ...options, fetchImpl })).rejects.toMatchObject({
      name: "MetricsRequestError",
      message,
      statusCode: status,
    });
  });
});
