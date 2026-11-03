import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export async function checkRelease() {
  let count = 0;
  async function checkDirectory(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await checkDirectory(fullPath);
        continue;
      }
      const relative = path.relative("dist", fullPath).replaceAll("\\", "/");
      assert.match(relative, /^(index\.html|experience\.html|404\.html|favicon\.svg|robots\.txt|roddy-(headshot|seated)\.jpg|assets\/[\w-]+\.(js|css))$/,
        `Unexpected release file: ${relative}`);
      if (relative.endsWith(".jpg")) {
        const image = await readFile(fullPath);
        assert.ok(image.length < 200_000, `Portrait exceeds 200 KB: ${relative}`);
        assert.equal(image.readUInt16BE(0), 0xffd8, `Invalid JPEG: ${relative}`);
        let offset = 2;
        let scanFound = false;
        while (offset + 3 < image.length) {
          assert.equal(image[offset], 0xff, `Invalid JPEG marker: ${relative}`);
          const marker = image[offset + 1];
          if (marker === 0xda) { scanFound = true; break; }
          assert.ok(!(marker >= 0xe0 && marker <= 0xef) && marker !== 0xfe,
            `Portrait contains application metadata/comments: ${relative}`);
          const length = image.readUInt16BE(offset + 2);
          assert.ok(length >= 2 && offset + length + 2 <= image.length, `Invalid JPEG segment: ${relative}`);
          offset += length + 2;
        }
        assert.ok(scanFound, `Missing JPEG image scan: ${relative}`);
        count++;
        continue;
      }
      const text = await readFile(fullPath, "utf8");
      assert.doesNotMatch(text, /AIza[0-9A-Za-z_-]{20,}|googlesyndication|icloud\.com|family-photo|sourceMappingURL|Career Impact Record|internal project names/i,
        `Release contains excluded content: ${relative}`);
      count++;
    }
  }
  await checkDirectory("dist");
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
  assert.equal(await readFile("dist/404.html", "utf8"), index);
  const javascript = (await readdir("dist/assets")).filter((file) => file.endsWith(".js"));
  assert.ok(javascript.length > 0, "Missing application bundle");
  const app = (await Promise.all(javascript.map((file) => readFile(`dist/assets/${file}`, "utf8")))).join("\n");
  for (const expected of ["Roddy Tomlin", "Director of Software Engineering", "FMG"]) {
    assert.ok(app.includes(expected), `Missing public fact: ${expected}`);
  }
  console.log(`Release checks passed: ${count} public-only files; safe retired-path fallback.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await checkRelease();
}
