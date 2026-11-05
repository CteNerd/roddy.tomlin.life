import assert from "node:assert/strict";
import { test } from "node:test";
import { createHandler, type Request } from "./handler.ts";
import { createProjectionReader } from "./projections.ts";
import { ReportingIntegrityError } from "@rct/portfolio-reporting/stored-projection";

const owner = "00000000-0000-4000-8000-000000000001";
const handler = createHandler(async () => [], owner);
const projection = {
  PK: "MONTH#2026-11", SK: "consulting#inboundLeads", total: 3, version: 3,
  latestOccurredAt: "2026-11-05T16:00:00.000Z", updatedAt: "2026-11-05T16:01:00.000Z",
};

function request(path: string, method = "GET"): Request {
  return {
    version: "2.0", routeKey: `${method} ${path}`, rawPath: path,
    rawQueryString: "", headers: {}, isBase64Encoded: false,
    requestContext: {
      accountId: "123456789012", apiId: "test", domainName: "api.example.invalid",
      domainPrefix: "api", requestId: "test", routeKey: `${method} ${path}`,
      stage: "$default", time: "2026-11-05T00:00:00Z", timeEpoch: 0,
      http: { method, path, protocol: "HTTP/1.1", sourceIp: "127.0.0.1", userAgent: "test" },
    },
  };
}

test("health remains safe and metrics has no mutation routes or anonymous data", async () => {
  const result = await handler(request("/health"));
  assert.equal(result.statusCode, 200);
  assert.deepEqual(JSON.parse(result.body!), { status: "ok", application: "founder" });
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    assert.equal((await handler(request("/metrics", method))).statusCode, 404);
  }
  assert.equal((await handler(request("/metrics"))).statusCode, 401);
});

function metrics(query = "month=2026-11", claims: Record<string, unknown> = { sub: owner, token_use: "access" }): Request {
  const event = request("/metrics");
  event.rawQueryString = query;
  event.requestContext.authorizer = { jwt: { claims } };
  return event;
}

test("only the exact configured owner receives bounded aggregate fields, never storage keys or receipts", async () => {
  const api = createHandler(async (month) => {
    assert.equal(month, "2026-11");
    return [{ ...projection, SK: "dotcom#mentorApprovals", total: -1 }, projection];
  }, owner);
  const result = await api(metrics());
  assert.equal(result.statusCode, 200);
  assert.equal(result.headers?.["cache-control"], "no-store");
  assert.deepEqual(JSON.parse(result.body!), { month: "2026-11", metrics: [
    { domain: "consulting", metric: "inboundLeads", total: 3, latestOccurredAt: projection.latestOccurredAt, processedAt: projection.updatedAt },
    { domain: "dotcom", metric: "mentorApprovals", total: -1, latestOccurredAt: projection.latestOccurredAt, processedAt: projection.updatedAt },
  ] });
});

test("headers, other subjects, ID tokens and disabled owner configuration cannot trigger database reads", async () => {
  let reads = 0;
  const read = async () => { reads++; return []; };
  const api = createHandler(read, owner);
  const anonymous = request("/metrics");
  anonymous.headers.authorization = "unverified";
  assert.equal((await api(anonymous)).statusCode, 401);
  for (const claims of [
    { sub: "00000000-0000-4000-8000-000000000002", token_use: "access" },
    { sub: owner, token_use: "id" }, { sub: owner },
    { sub: "other", token_use: "access", "cognito:groups": ["founder-owner"] },
  ]) assert.equal((await api(metrics("month=2026-11", claims))).statusCode, 403);
  assert.equal((await createHandler(read, "disabled")(metrics())).statusCode, 403);
  assert.throws(() => createHandler(read, ""), /explicit Cognito owner/);
  assert.equal(reads, 0);
});

test("month selection is explicit and unambiguous; empty months are absent observations, not zero totals", async () => {
  let reads = 0;
  const api = createHandler(async () => { reads++; return []; }, owner);
  for (const query of [
    "", "month=2026-00", "month=2026-13", "month=10000-01", "month=2026-1",
    "month=2026-11&month=2026-12", "month=2026-11&domain=consulting",
  ]) assert.equal((await api(metrics(query))).statusCode, 400);
  assert.equal(reads, 0);
  for (const month of ["0000-01", "9999-12"]) {
    const result = await api(metrics(`month=${month}`));
    assert.equal(result.statusCode, 200);
    assert.deepEqual(JSON.parse(result.body!), { month, metrics: [] });
  }
});

test("storage failures are explicit 503s with safe diagnostics rather than fabricated successful metrics", async () => {
  const logs: unknown[] = [];
  const api = createHandler(async () => { throw new Error("private secret payload"); }, owner, (failure) => logs.push(failure));
  const result = await api(metrics());
  assert.equal(result.statusCode, 503);
  assert.deepEqual(JSON.parse(result.body!), { error: "Reporting temporarily unavailable" });
  assert.deepEqual(logs, [{ requestId: "test", reason: "storage_failure" }]);
  assert.doesNotMatch(JSON.stringify({ result, logs }), /private secret/);
});

test("corrupt, duplicate, private or wrong-partition records fail closed without serialization", async () => {
  for (const rows of [
    [projection, projection], [{ ...projection, PK: "EVENT#private" }],
    [{ ...projection, participantEmail: "private@example.invalid" }],
    [{ ...projection, total: Number.MAX_SAFE_INTEGER + 1 }],
    [{ ...projection, updatedAt: "invalid" }],
    [{ ...projection, SK: "consulting#revenue" }],
  ]) {
    const logs: unknown[] = [];
    const result = await createHandler(async () => rows, owner, (failure) => logs.push(failure))(metrics());
    assert.equal(result.statusCode, 503);
    assert.doesNotMatch(result.body!, /private@example|EVENT#|revenue/);
    assert.deepEqual(logs, [{ requestId: "test", reason: "storage_integrity" }]);
  }
});

test("the DynamoDB adapter queries one owned month consistently and rejects incomplete or oversized responses", async () => {
  let reads = 0;
  const reader = createProjectionReader("reporting-test", async (input) => {
    reads++;
    assert.deepEqual(input, {
      TableName: "reporting-test", KeyConditionExpression: "PK = :month",
      ExpressionAttributeValues: { ":month": "MONTH#2026-11" }, ConsistentRead: true, Limit: 3,
    });
    return { Items: [projection] };
  });
  assert.deepEqual(await reader("2026-11"), [projection]);
  await assert.rejects(() => reader("2026-13"), /valid reporting month/);
  assert.equal(reads, 1);
  for (const result of [{}, { Items: [], LastEvaluatedKey: { PK: "MONTH#2026-11" } }, { Items: [projection, projection, projection] }]) {
    await assert.rejects(() => createProjectionReader("reporting-test", async () => result)("2026-11"), ReportingIntegrityError);
  }
});

test("identity requires Gateway-validated claims, not an Authorization header", async () => {
  const event = request("/me");
  event.headers.authorization = "unverified";
  assert.equal((await handler(event)).statusCode, 401);
  event.requestContext.authorizer = { jwt: { claims: { sub: "synthetic-owner" } } };
  assert.deepEqual(JSON.parse((await handler(event)).body!), { userId: "synthetic-owner" });
});
