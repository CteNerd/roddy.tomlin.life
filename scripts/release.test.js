// @vitest-environment node
import { build } from "vite";
import path from "node:path";
import { expect, it } from "vitest";

it.each(["src/unapproved-fixture.js", "docs/unapproved-fixture.js"])(
  "rejects an accidental private module import: %s",
  async (relative) => {
    const fixture = path.resolve(relative);
    await expect(build({
      logLevel: "silent",
      plugins: [{
        name: "unapproved-import-fixture",
        transform(code, id) {
          if (id.endsWith("/src/main.jsx")) return `${code}\nimport '${fixture}';`;
        },
        resolveId(id) {
          if (id === fixture) return fixture;
        },
        load(id) {
          if (id === fixture) return 'globalThis.privateReleaseFixture = "must not ship";';
        },
      }],
      build: { write: false },
    })).rejects.toThrow(`Release blocked: unapproved source module ${relative}`);
  },
);
