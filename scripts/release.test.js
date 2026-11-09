// @vitest-environment node
import { build } from "vite";
import path from "node:path";
import { expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { applyMetadata, renderMetadata, renderSitemap } from "./page-metadata.mjs";
import { founderFiles, publisherPolicy, verifyPayload, verifyProtection, verifyProvenance } from "./founder-promotion.mjs";
import { mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

it.each([
  ["home", "https://roddy.tomlin.life/", "Roddy Tomlin | Engineering Leadership"],
  ["experience", "https://roddy.tomlin.life/experience.html", "Experience | Roddy Tomlin"],
])("renders canonical, sharing, and factual structured metadata for %s", (page, url, title) => {
  const document = new JSDOM(`<html><head>${renderMetadata(page)}</head></html>`).window.document;
  expect(document.title).toBe(title);
  expect(document.querySelector('link[rel="canonical"]').href).toBe(url);
  expect(document.querySelector('meta[property="og:url"]').content).toBe(url);
  expect(document.querySelector('meta[property="og:title"]').content).toBe(title);
  expect(document.querySelector('meta[name="twitter:title"]').content).toBe(title);
  const description = document.querySelector('meta[name="description"]').content;
  expect(document.querySelector('meta[property="og:description"]').content).toBe(description);
  expect(document.querySelector('meta[name="twitter:description"]').content).toBe(description);
  expect(document.querySelector('meta[property="og:image"]').content).toBe("https://roddy.tomlin.life/roddy-headshot.jpg");
  expect(document.querySelector('meta[name="twitter:image"]').content).toBe("https://roddy.tomlin.life/roddy-headshot.jpg");
  const data = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
  expect(data).toMatchObject({
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    mainEntity: {
      "@type": "Person",
      "@id": "https://roddy.tomlin.life/#person",
      name: "Roddy Tomlin",
      jobTitle: "Director of Software Engineering",
      worksFor: { "@type": "Organization", name: "FMG" },
      sameAs: ["https://www.linkedin.com/in/tutoringrod/"],
    },
  });
  expect(data.mainEntity).not.toHaveProperty("email");
  expect(data.mainEntity).not.toHaveProperty("telephone");
});

it("replaces only the metadata boundary and rejects a missing boundary", () => {
  const template = '<head><!-- profile-metadata:start --><title>Old</title><!-- profile-metadata:end --></head><body>Approved content</body>';
  expect(applyMetadata(template, "home")).toBe(`<head>${renderMetadata("home")}</head><body>Approved content</body>`);
  expect(() => applyMetadata("<head></head>", "home")).toThrow("Missing profile metadata template boundary");
  expect(() => renderMetadata("unknown")).toThrow("Unknown metadata page");
});

it("keeps retired paths non-indexable and includes only public pages in the sitemap", () => {
  const document = new JSDOM(`<head>${renderMetadata("notFound")}</head>`).window.document;
  expect(document.querySelector('meta[name="robots"]').content).toBe("noindex, follow");
  expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
  const sitemap = new JSDOM(renderSitemap(), { contentType: "application/xml" }).window.document;
  expect([...sitemap.querySelectorAll("loc")].map((node) => node.textContent)).toEqual([
    "https://roddy.tomlin.life/",
    "https://roddy.tomlin.life/experience.html",
  ]);
});

it.each([
  "src/unapproved-fixture.js",
  "docs/unapproved-fixture.js",
  "apps/founder-web/src/uat-rehearsal.js",
])(
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

it("binds promotion to the exact successful main candidate run and immutable artifact digest", () => {
  const sha = "a".repeat(40);
  const digest = `sha256:${"b".repeat(64)}`;
  const repository = "CteNerd/roddy.tomlin.life";
  const run = {
    id: 123, repository: { full_name: repository }, head_repository: { full_name: repository },
    path: ".github/workflows/founder-candidate.yml", event: "workflow_dispatch",
    head_branch: "main", head_sha: sha, conclusion: "success",
  };
  const artifact = {
    workflow_run: { id: 123, head_sha: sha }, name: `founder-${sha}`, expired: false, digest,
  };
  const evidence = { run, artifact, sha, digest, repository };
  expect(() => verifyProvenance(evidence)).not.toThrow();
  for (const changes of [
    { event: "pull_request" }, { head_branch: "release/unsafe" }, { conclusion: "failure" },
    { path: ".github/workflows/aws.yml" }, { head_sha: "c".repeat(40) },
    { head_repository: { full_name: "fork/roddy.tomlin.life" } },
  ]) expect(() => verifyProvenance({ ...evidence, run: { ...run, ...changes } })).toThrow();
  for (const changes of [
    { expired: true }, { digest: `sha256:${"c".repeat(64)}` },
    { workflow_run: { id: 456, head_sha: sha } }, { name: "unreviewed" },
  ]) expect(() => verifyProvenance({ ...evidence, artifact: { ...artifact, ...changes } })).toThrow();
});

it("fails closed on absent production review or non-main deployment policies", () => {
  const environment = {
    name: "production",
    protection_rules: [{ type: "required_reviewers", reviewers: [{ type: "User" }] }],
    deployment_branch_policy: { custom_branch_policies: true },
  };
  const policies = { branch_policies: [{ name: "main", type: "branch" }] };
  expect(() => verifyProtection(environment, policies)).not.toThrow();
  expect(() => verifyProtection({ ...environment, name: "aws-production" }, policies)).toThrow();
  expect(() => verifyProtection({ ...environment, protection_rules: [] }, policies)).toThrow();
  expect(() => verifyProtection({ ...environment, deployment_branch_policy: null }, policies)).toThrow();
  expect(() => verifyProtection(environment, { branch_policies: [
    { name: "main", type: "branch" }, { name: "*", type: "tag" },
  ] })).toThrow();
});

it("rejects altered, unexpected, and symlinked Founder payload files before publishing", async () => {
  const root = path.resolve(`.founder-promotion-test-${process.pid}`);
  const assets = path.join(root, "founder-dist/assets");
  const sha = "a".repeat(40);
  try {
    await mkdir(assets, { recursive: true });
    await writeFile(path.join(root, "founder-dist/index.html"), '<script src="/founder/assets/index-abcd.js"></script>');
    await writeFile(path.join(assets, "index-abcd.js"), "export {};");
    const files = await founderFiles(path.join(root, "founder-dist"));
    await writeFile(path.join(root, "release.json"), JSON.stringify({ sha, ownerAccess: "disabled", files }));
    await expect(verifyPayload(root, sha)).resolves.toMatchObject({ sha });
    await expect(verifyPayload(root, "b".repeat(40))).rejects.toThrow();
    await writeFile(path.join(assets, "index-abcd.js"), "changed");
    await expect(verifyPayload(root, sha)).rejects.toThrow();
    await writeFile(path.join(assets, "index-abcd.js"), "export {};");
    await writeFile(path.join(root, "founder-dist/404.html"), "must not overwrite the profile fallback");
    await expect(verifyPayload(root, sha)).rejects.toThrow("Unapproved Founder file");
    await rm(path.join(root, "founder-dist/404.html"));
    await symlink("index-abcd.js", path.join(assets, "linked.js"));
    await expect(verifyPayload(root, sha)).rejects.toThrow("Unapproved Founder file");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

it("limits publisher credentials to Founder object writes and the existing CDN", () => {
  const policy = publisherPolicy("approved-profile-bucket", "E1234567890ABC");
  expect(policy.Statement).toEqual([
    { Effect: "Allow", Action: "s3:PutObject", Resource: "arn:aws:s3:::approved-profile-bucket/founder/*" },
    {
      Effect: "Allow", Action: ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"],
      Resource: "arn:aws:cloudfront::425061472162:distribution/E1234567890ABC",
    },
  ]);
  expect(() => publisherPolicy("bucket/founder/../../", "E1234567890ABC")).toThrow();
  expect(() => publisherPolicy("approved-profile-bucket", "*")).toThrow();
});

it("stops the workflow policy step before exporting output when publisher configuration is invalid", async () => {
  const workflow = await readFile(".github/workflows/founder-promote.yml", "utf8");
  const commands = workflow.split("\n").filter((line) =>
    line.includes("scripts/founder-promotion.mjs policy") || line.includes('"$GITHUB_OUTPUT"')).join("\n");
  const root = path.resolve(`.founder-policy-test-${process.pid}`);
  const output = path.join(root, "output");
  try {
    await mkdir(root);
    const environment = {
      ...process.env,
      FOUNDER_BUCKET: "approved-profile-bucket",
      FOUNDER_DISTRIBUTION: "E1234567890ABC",
      GITHUB_OUTPUT: output,
    };
    for (const invalid of [{ FOUNDER_BUCKET: "" }, { FOUNDER_DISTRIBUTION: "*" }]) {
      await writeFile(output, "");
      expect(() => execFileSync("bash", ["-euo", "pipefail", "-c", commands], {
        env: { ...environment, ...invalid }, stdio: "pipe",
      })).toThrow();
      expect(await readFile(output, "utf8")).toBe("");
    }
    execFileSync("bash", ["-euo", "pipefail", "-c", commands], { env: environment, stdio: "pipe" });
    expect(JSON.parse((await readFile(output, "utf8")).trim().slice("json=".length)))
      .toEqual(publisherPolicy(environment.FOUNDER_BUCKET, environment.FOUNDER_DISTRIBUTION));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

it("routes only exact Founder entry URLs and leaves root, assets, and retired routes untouched", async () => {
  const template = await readFile("infrastructure/profile-hosting.yml", "utf8");
  const code = template.match(/FunctionCode: \|\n((?: {8}.+\n)+)/)[1];
  const handler = vm.runInNewContext(`${code}\nhandler`);
  for (const uri of ["/founder", "/founder/"]) {
    expect(handler({ request: { uri, querystring: { code: { value: "authorization-code" } } } }))
      .toEqual({ uri: "/founder/index.html", querystring: { code: { value: "authorization-code" } } });
  }
  for (const uri of ["/", "/experience.html", "/assets/index.js", "/404.html", "/about/childhood",
    "/founder/assets/index.js", "/founder/missing", "/founder-other", "/Founder/"]) {
    expect(handler({ request: { uri } })).toEqual({ uri });
  }
});
