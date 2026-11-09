import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pages, renderMetadata, renderSitemap, siteUrl } from "./page-metadata.mjs";

export async function checkRelease() {
  let count = 0;
  async function checkDirectory(directory, artifactRoot, allowedFiles) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await checkDirectory(fullPath, artifactRoot, allowedFiles);
        continue;
      }
      const relative = path.relative(artifactRoot, fullPath).replaceAll("\\", "/");
      assert.match(relative, allowedFiles,
        `Unexpected release file: ${relative}`);
      if (relative.endsWith(".jpg")) {
        const image = await readFile(fullPath);
        assert.ok(image.length < 200_000, `Portrait exceeds 200 KB: ${relative}`);
        assert.equal(image.readUInt16BE(0), 0xffd8, `Invalid JPEG: ${relative}`);
        let offset = 2;
        let scanFound = false;
        let dimensions;
        while (offset + 3 < image.length) {
          assert.equal(image[offset], 0xff, `Invalid JPEG marker: ${relative}`);
          const marker = image[offset + 1];
          if (marker === 0xda) { scanFound = true; break; }
          assert.ok(!(marker >= 0xe0 && marker <= 0xef) && marker !== 0xfe,
            `Portrait contains application metadata/comments: ${relative}`);
          const length = image.readUInt16BE(offset + 2);
          assert.ok(length >= 2 && offset + length + 2 <= image.length, `Invalid JPEG segment: ${relative}`);
          if (marker === 0xc0 || marker === 0xc2) {
            assert.ok(length >= 8, `Invalid JPEG dimensions: ${relative}`);
            dimensions = { height: image.readUInt16BE(offset + 5), width: image.readUInt16BE(offset + 7) };
          }
          offset += length + 2;
        }
        assert.ok(scanFound, `Missing JPEG image scan: ${relative}`);
        if (relative === "roddy-headshot.jpg") {
          assert.deepEqual(dimensions, { width: 721, height: 901 }, "Sharing image dimensions must match its metadata");
        }
        count++;
        continue;
      }
      const text = await readFile(fullPath, "utf8");
      assert.doesNotMatch(text, /AIza[0-9A-Za-z_-]{20,}|googlesyndication|icloud\.com|family-photo|sourceMappingURL|Career Impact Record|internal project names/i,
        `Release contains excluded content: ${relative}`);
      count++;
    }
  }
  await checkDirectory(
    "dist",
    "dist",
    /^(index\.html|experience\.html|404\.html|favicon\.svg|robots\.txt|sitemap\.xml|roddy-(headshot|seated)\.jpg|assets\/[\w-]+\.(js|css))$/,
  );
  await checkDirectory("founder-dist", "founder-dist", /^(index\.html|assets\/[\w-]+\.(js|css))$/);
  const index = await readFile("dist/index.html", "utf8");
  assert.match(index, /Roddy Tomlin/);
  assert.match(index, /Director of Software Engineering/);
  assert.match(index, /FMG/);
  assert.match(index, /<h1 /, "The release must include prerendered profile content");
  assert.match(index, /id="connect"/, "The release must work without JavaScript");
  assert.doesNotMatch(index, /id="experience"/, "The homepage must not include the full timeline");
  assert.match(index, /Jacksonville Jaguars/);
  assert.match(index, /Atlanta Falcons/);
  const experience = await readFile("dist/experience.html", "utf8");
  assert.match(experience, /<title>Experience \| Roddy Tomlin<\/title>/);
  assert.match(experience, /<h1 id="experience-title"/);
  assert.match(experience, /February 2026 - Present/);
  assert.match(experience, /Murray State University/);
  assert.doesNotMatch(experience, /id="hero-title"/);
  for (const name of ["roddy-headshot.jpg", "roddy-seated.jpg"]) {
    assert.ok(index.includes(name), `Missing approved portrait: ${name}`);
    await readFile(path.join("dist", name));
  }
  for (const [page, html] of [["home", index], ["experience", experience]]) {
    assert.ok(html.includes(renderMetadata(page)), `Missing or incorrect ${page} metadata`);
    assert.equal((html.match(/<link rel="canonical"/g) || []).length, 1, `Duplicate ${page} canonical`);
    assert.equal((html.match(/<title>/g) || []).length, 1, `Duplicate ${page} title`);
    assert.equal((html.match(/<meta name="description"/g) || []).length, 1, `Duplicate ${page} description`);
    assert.doesNotMatch(html, /noindex|profile-metadata:/);
    assert.ok(html.includes(new URL(pages[page].path, siteUrl).href));
  }
  const fallback = await readFile("dist/404.html", "utf8");
  assert.ok(fallback.includes(renderMetadata("notFound")));
  assert.doesNotMatch(fallback, /rel="canonical"|application\/ld\+json/);
  assert.equal(fallback.slice(fallback.indexOf("<body>")), index.slice(index.indexOf("<body>")));
  const founder = await readFile("founder-dist/index.html", "utf8");
  assert.match(founder, /<meta name="robots" content="noindex, nofollow"/);
  assert.match(founder, /<div id="root"><\/div>/, "Founder data must only load after authenticated API requests");
  assert.doesNotMatch(founder, /application\/json|latestOccurredAt|processedAt|access_token/);
  const founderScripts = (await readdir("founder-dist/assets")).filter((file) => file.endsWith(".js"));
  assert.ok(founderScripts.length > 0, "Missing Founder application bundle");
  assert.ok(
    founderScripts.every((file) => !/rehearsal/i.test(file)),
    "Synthetic rehearsal modules must not be emitted in the Founder release",
  );
  const founderBundle = (await Promise.all(
    founderScripts.map((file) => readFile(`founder-dist/assets/${file}`, "utf8")),
  )).join("\n");
  assert.doesNotMatch(founderBundle, /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
    "Founder release must not contain tokens or owner subject identifiers");
  assert.doesNotMatch(
    founderBundle,
    /uat-rehearsal\.js|VITE_FOUNDER_UAT_REHEARSAL|Synthetic local rehearsal|Synthetic monthly timeline|synthetic-local-rehearsal/i,
    "Founder release must not contain the opt-in synthetic rehearsal or its fixtures",
  );
  assert.equal(await readFile("dist/sitemap.xml", "utf8"), renderSitemap());
  assert.ok((await readFile("dist/robots.txt", "utf8")).includes(`Sitemap: ${siteUrl}sitemap.xml`));
  const javascript = (await readdir("dist/assets")).filter((file) => file.endsWith(".js"));
  assert.ok(javascript.length > 0, "Missing application bundle");
  const app = (await Promise.all(javascript.map((file) => readFile(`dist/assets/${file}`, "utf8")))).join("\n");
  assert.doesNotMatch(
    app,
    /uat-rehearsal\.js|VITE_FOUNDER_UAT_REHEARSAL|Synthetic local rehearsal|Synthetic monthly timeline|synthetic-local-rehearsal/i,
    "Public profile release must not contain Founder rehearsal code or fixtures",
  );
  for (const expected of ["Roddy Tomlin", "Director of Software Engineering", "FMG"]) {
    assert.ok(app.includes(expected), `Missing public fact: ${expected}`);
  }
  console.log(`Release checks passed: ${count} approved files; safe retired-path fallback.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await checkRelease();
}
