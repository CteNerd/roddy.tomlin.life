import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const shaPattern = /^[0-9a-f]{40}$/;
const digestPattern = /^sha256:[0-9a-f]{64}$/;
const filePattern = /^(index\.html|assets\/[\w-]+\.(js|css))$/;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function founderFiles(root) {
  const files = {};
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const location = path.join(directory, entry.name);
      const relative = path.relative(root, location).replaceAll("\\", "/");
      if (entry.isDirectory()) {
        assert.equal(relative, "assets", "Only the Founder assets directory may be published");
        await visit(location);
      } else {
        assert.ok(entry.isFile() && filePattern.test(relative), `Unapproved Founder file: ${relative}`);
        files[relative] = hash(await readFile(location));
      }
    }
  }
  await visit(root);
  assert.ok(files["index.html"] && Object.keys(files).some((file) => file.endsWith(".js")));
  return Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
}

export function verifyProvenance({ run, artifact, sha, digest, repository }) {
  assert.match(sha, shaPattern);
  assert.match(digest, digestPattern);
  assert.equal(run.repository.full_name, repository);
  assert.equal(run.head_repository.full_name, repository);
  assert.equal(run.path, ".github/workflows/founder-candidate.yml");
  assert.equal(run.event, "workflow_dispatch");
  assert.equal(run.head_branch, "main");
  assert.equal(run.head_sha, sha);
  assert.equal(run.conclusion, "success");
  assert.equal(artifact.workflow_run.id, run.id);
  assert.equal(artifact.workflow_run.head_sha, sha);
  assert.equal(artifact.name, `founder-${sha}`);
  assert.equal(artifact.expired, false);
  assert.equal(artifact.digest, digest);
}

export function verifyProtection(environment, branchPolicies) {
  assert.equal(environment.name, "production");
  assert.ok(environment.protection_rules.some((rule) =>
    rule.type === "required_reviewers" && rule.reviewers.length > 0),
  "Production must require a reviewer");
  assert.equal(environment.deployment_branch_policy?.custom_branch_policies, true);
  assert.deepEqual(branchPolicies.branch_policies.map(({ name, type }) => ({ name, type })),
    [{ name: "main", type: "branch" }], "Production must allow main only, without tags");
}

export function publisherPolicy(bucket, distribution) {
  assert.match(bucket, /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/);
  assert.match(distribution, /^[A-Z0-9]{8,32}$/);
  return {
    Version: "2012-10-17",
    Statement: [
      { Effect: "Allow", Action: "s3:PutObject", Resource: `arn:aws:s3:::${bucket}/founder/*` },
      {
        Effect: "Allow",
        Action: ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"],
        Resource: `arn:aws:cloudfront::425061472162:distribution/${distribution}`,
      },
    ],
  };
}

export async function verifyPayload(root, sha) {
  assert.match(sha, shaPattern);
  const manifest = JSON.parse(await readFile(path.join(root, "release.json"), "utf8"));
  assert.deepEqual(Object.keys(manifest).sort(), ["files", "ownerAccess", "sha"]);
  assert.equal(manifest.sha, sha);
  assert.equal(manifest.ownerAccess, "disabled");
  assert.deepEqual(manifest.files, await founderFiles(path.join(root, "founder-dist")));
  return manifest;
}

async function main() {
  const [command, root, sha] = process.argv.slice(2);
  if (command === "manifest") {
    assert.match(sha, shaPattern);
    await writeFile(path.join(root, "release.json"), JSON.stringify({
      sha, ownerAccess: "disabled", files: await founderFiles(path.join(root, "founder-dist")),
    }, null, 2));
  } else if (command === "provenance") {
    verifyProvenance({
      run: JSON.parse(await readFile("candidate-run.json", "utf8")),
      artifact: JSON.parse(await readFile("candidate-artifact.json", "utf8")),
      sha: process.env.REVIEWED_SHA,
      digest: process.env.REVIEWED_DIGEST,
      repository: process.env.GITHUB_REPOSITORY,
    });
  } else if (command === "policy") {
    console.log(JSON.stringify(publisherPolicy(process.env.FOUNDER_BUCKET, process.env.FOUNDER_DISTRIBUTION)));
  } else if (command === "protection") {
    verifyProtection(
      JSON.parse(await readFile("production-environment.json", "utf8")),
      JSON.parse(await readFile("production-branches.json", "utf8")),
    );
  } else if (command === "verify") {
    await verifyPayload(root, sha);
  } else if (command === "publish") {
    const manifest = await verifyPayload(root, sha);
    const bucket = process.env.FOUNDER_BUCKET;
    const distribution = process.env.FOUNDER_DISTRIBUTION;
    publisherPolicy(bucket, distribution);
    const aws = (args) => execFileSync("aws", args, { stdio: "inherit" });
    // Hashed assets first, entry point last; never sync/delete or write profile keys.
    const files = Object.keys(manifest.files).filter((file) => file !== "index.html").sort();
    files.push("index.html");
    for (const file of files) {
      aws(["s3", "cp", path.join(root, "founder-dist", file), `s3://${bucket}/founder/${file}`,
        "--cache-control", file === "index.html" ? "no-cache" : "public,max-age=31536000,immutable",
        "--only-show-errors"]);
    }
    const invalidation = JSON.parse(execFileSync("aws", ["cloudfront", "create-invalidation",
      "--distribution-id", distribution, "--paths", "/founder", "/founder/", "/founder/index.html",
      "--output", "json"], { encoding: "utf8" }));
    aws(["cloudfront", "wait", "invalidation-completed", "--distribution-id", distribution,
      "--id", invalidation.Invalidation.Id]);
  } else {
    throw new Error("Unknown Founder promotion command");
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
