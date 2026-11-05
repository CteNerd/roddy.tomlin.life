import assert from "node:assert/strict";
import { test } from "node:test";
import { handler, type Request } from "./handler.ts";

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

test("health is safe and the foundation contains no business mutation or fake metrics routes", async () => {
  const result = await handler(request("/health"));
  assert.equal(result.statusCode, 200);
  assert.deepEqual(JSON.parse(result.body!), { status: "ok", application: "founder" });
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    assert.equal((await handler(request("/metrics", method))).statusCode, 404);
  }
  assert.equal((await handler(request("/metrics"))).statusCode, 404);
});

test("identity requires Gateway-validated claims, not an Authorization header", async () => {
  const event = request("/me");
  event.headers.authorization = "unverified";
  assert.equal((await handler(event)).statusCode, 401);
  event.requestContext.authorizer = { jwt: { claims: { sub: "synthetic-owner" } } };
  assert.deepEqual(JSON.parse((await handler(event)).body!), { userId: "synthetic-owner" });
});
