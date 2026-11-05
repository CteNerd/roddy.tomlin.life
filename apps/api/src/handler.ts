import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { isReportingMonth, parseStoredProjection, ReportingIntegrityError } from "@rct/portfolio-reporting/stored-projection";

export type Request = APIGatewayProxyEventV2 & {
  requestContext: {
    authorizer?: { jwt?: { claims?: Record<string, unknown> } };
  };
};

function response(statusCode: number, body: object): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
    body: JSON.stringify(body),
  };
}

export function createHandler(
  readProjections: (month: string) => Promise<unknown[]>,
  ownerSubject: string,
  logFailure: (failure: { requestId: string; reason: "storage_integrity" | "storage_failure" }) => void = (failure) => console.error(JSON.stringify(failure)),
) {
  if (!/^(disabled|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/.test(ownerSubject)) {
    throw new Error("An explicit Cognito owner subject or disabled gate is required");
  }
  return async (event: Request): Promise<APIGatewayProxyStructuredResultV2> => {
    if (event.requestContext.http.method !== "GET") return response(404, { error: "Not found" });
    if (event.rawPath === "/health") {
      return response(200, { status: "ok", application: "founder" });
    }
    if (event.rawPath === "/me") {
      const subject = event.requestContext.authorizer?.jwt?.claims?.sub;
      if (typeof subject !== "string" || subject.length === 0) {
        return response(401, { error: "Authentication required" });
      }
      return response(200, { userId: subject });
    }
    if (event.rawPath === "/metrics") {
      const claims = event.requestContext.authorizer?.jwt?.claims;
      if (typeof claims?.sub !== "string" || !claims.sub) return response(401, { error: "Authentication required" });
      if (ownerSubject === "disabled" || claims.sub !== ownerSubject || claims.token_use !== "access") {
        return response(403, { error: "Owner access required" });
      }
      const parameters = new URLSearchParams(event.rawQueryString);
      const month = parameters.get("month");
      if (parameters.getAll("month").length !== 1 || [...parameters.keys()].some((key) => key !== "month") || !isReportingMonth(month)) {
        return response(400, { error: "Exactly one month in YYYY-MM format is required" });
      }
      try {
        const rows = (await readProjections(month)).map((row) => parseStoredProjection(row, month));
        if (rows.length > 2 || new Set(rows.map((row) => row.SK)).size !== rows.length) throw new ReportingIntegrityError();
        rows.sort((a, b) => a.SK.localeCompare(b.SK));
        return response(200, { month, metrics: rows.map((row) => ({
          ...(row.SK === "consulting#inboundLeads" ? { domain: "consulting", metric: "inboundLeads" } : { domain: "dotcom", metric: "mentorApprovals" }),
          total: row.total, latestOccurredAt: row.latestOccurredAt, processedAt: row.updatedAt,
        })) });
      } catch (error) {
        logFailure({ requestId: event.requestContext.requestId, reason: error instanceof ReportingIntegrityError ? "storage_integrity" : "storage_failure" });
        return response(503, { error: "Reporting temporarily unavailable" });
      }
    }
    return response(404, { error: "Not found" });
  };
}
