// @vitest-environment node
import { build } from "vite";
import path from "node:path";
import { expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { applyMetadata, renderMetadata, renderSitemap } from "./page-metadata.mjs";

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
