import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const [commit, targetArgument] = process.argv.slice(2);
assert.match(commit ?? "", /^[a-f0-9]{40}$/, "Usage: node scripts/sync-portfolio-contracts.mjs <full-commit> <producer-repo>");
assert.ok(targetArgument, "A producer repository path is required");
const source = resolve(import.meta.dirname, "..");
const target = resolve(targetArgument);
assert.notEqual(source, target, "Do not replace authoritative contracts with a pinned copy");
const git = (cwd, args) => execFileSync("git", ["-C", cwd, ...args]);
const targetRemote = git(target, ["remote", "get-url", "origin"]).toString().trim();
assert.match(targetRemote, /^(https:\/\/github\.com\/|git@github\.com:)CteNerd\/(consulting|community)\.wellcall\.biz(?:\.git)?$/, "Target must be a portfolio producer");
assert.equal(git(target, ["status", "--porcelain", "--untracked-files=all", "--", "packages/contracts", "packages/contracts.lock.json"]).toString(), "", "Commit or resolve producer contract edits before synchronizing");
const entries = git(source, ["ls-tree", "-r", commit, "--", "packages/contracts"]).toString().trim().split("\n");
assert.ok(entries[0], "Authority commit contains no contracts");
const files = {};
const contents = new Map();
for (const entry of entries) {
  const match = /^(100644|100755) blob [a-f0-9]{40}\t(packages\/contracts\/[A-Za-z0-9._/-]+)$/.exec(entry);
  assert.ok(match, "Only regular contract source files can be synchronized");
  const path = match[2];
  assert.ok(!path.split("/").some((part) => part === ".." || part === "." || part === "node_modules"));
  const content = git(source, ["show", `${commit}:${path}`]);
  files[path] = createHash("sha256").update(content).digest("hex");
  contents.set(path, content);
}
const pinPath = resolve(target, "packages/contracts.lock.json");
if (existsSync(pinPath)) {
  const previous = JSON.parse(readFileSync(pinPath, "utf8"));
  assert.ok(Object.keys(previous.files).every((path) => Object.hasOwn(files, path)),
    "This update removes contract files; review and remove retired files explicitly before syncing");
}
for (const [path, content] of contents) {
  mkdirSync(dirname(resolve(target, path)), { recursive: true });
  writeFileSync(resolve(target, path), content);
}
writeFileSync(pinPath, `${JSON.stringify({
  version: 1,
  authority: { repository: "CteNerd/roddy.tomlin.life", commit },
  files,
}, null, 2)}\n`);
console.log(`Pinned ${contents.size} contract files to ${commit} in ${target}.`);
