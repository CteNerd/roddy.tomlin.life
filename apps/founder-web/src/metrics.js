const metricLabels = new Map([
  ["consulting#inboundLeads", "Consulting inbound leads"],
  ["dotcom#mentorApprovals", "Community mentor approvals"],
]);

export class MetricsRequestError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "MetricsRequestError";
    this.statusCode = statusCode;
  }
}

function isMonth(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  return Boolean(match && Number(match[2]) >= 1 && Number(match[2]) <= 12);
}

function isTimestamp(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const timestamp = new Date(value);
  return !Number.isNaN(timestamp.getTime()) && timestamp.toISOString() === value;
}

function parseMetrics(body, month) {
  if (!body || body.month !== month || !Array.isArray(body.metrics) || body.metrics.length > metricLabels.size) {
    throw new Error("The reporting response is invalid.");
  }
  const seen = new Set();
  const metrics = body.metrics.map((metric) => {
    const key = `${metric?.domain}#${metric?.metric}`;
    if (!metricLabels.has(key)
      || seen.has(key)
      || !Number.isSafeInteger(metric.total)
      || metric.total < 0
      || !isTimestamp(metric.latestOccurredAt)
      || !isTimestamp(metric.processedAt)) {
      throw new Error("The reporting response is invalid.");
    }
    seen.add(key);
    return {
      key,
      label: metricLabels.get(key),
      total: metric.total,
      latestOccurredAt: metric.latestOccurredAt,
      processedAt: metric.processedAt,
    };
  });
  return { month, metrics };
}

export async function fetchMetrics({ apiUrl, accessToken, month, signal, fetchImpl = globalThis.fetch }) {
  if (!isMonth(month) || typeof accessToken !== "string" || accessToken.length === 0) {
    throw new Error("A signed-in session and valid reporting month are required.");
  }
  const endpoint = new URL("/metrics", apiUrl);
  endpoint.searchParams.set("month", month);
  const response = await fetchImpl(endpoint, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
    signal,
  });
  if (response.status === 401) throw new MetricsRequestError("Your session expired. Sign in again.", 401);
  if (response.status === 403) throw new MetricsRequestError("This account is not authorized to view Founder reports.", 403);
  if (!response.ok) throw new MetricsRequestError("Reports are temporarily unavailable. Try again.", response.status);

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("The reporting response is invalid.");
  }
  return parseMetrics(body, month);
}
