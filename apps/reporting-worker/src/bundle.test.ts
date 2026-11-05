import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { buildSync } from "esbuild";

test("the actual CommonJS Lambda bundle loads schema validation without external source/schema files", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "rct-reporting-bundle-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const environment = {
    REPORTING_TABLE_NAME: "reporting-test",
    CONSULTING_QUEUE_ARN: "arn:aws:sqs:us-east-1:123456789012:rct-portfolio-development-reporting-consulting",
    DOTCOM_QUEUE_ARN: "arn:aws:sqs:us-east-1:123456789012:rct-portfolio-development-reporting-dotcom",
  };
  for (const [name, value] of Object.entries(environment)) {
    const previous = process.env[name];
    t.after(() => { if (previous === undefined) delete process.env[name]; else process.env[name] = previous; });
    process.env[name] = value;
  }
  const output = join(directory, "index.cjs");
  buildSync({
    entryPoints: [fileURLToPath(new URL("./index.ts", import.meta.url))],
    outfile: output, bundle: true, platform: "node", target: "node24", format: "cjs",
  });
  const module: unknown = createRequire(import.meta.url)(output);
  assert.ok(module && typeof module === "object" && "handler" in module && typeof module.handler === "function");
  assert.deepEqual(await module.handler({ Records: [] }), { batchItemFailures: [] });
});
