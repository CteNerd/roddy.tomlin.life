import { readFile, writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";
import { checkRelease } from "./check-release.mjs";
import { applyMetadata, renderSitemap } from "./page-metadata.mjs";

// Render the same public component for crawlers and visitors without JavaScript.
const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { default: App } = await server.ssrLoadModule("/src/App.jsx");
  const html = await readFile("dist/index.html", "utf8");
  const home = html.replace('<div id="root"></div>', `<div id="root">${renderToString(createElement(App))}</div>`);
  await writeFile("dist/index.html", applyMetadata(home, "home"));
  await writeFile("dist/experience.html", applyMetadata(
    html.replace('<div id="root"></div>', `<div id="root">${renderToString(createElement(App, { page: "experience" }))}</div>`),
    "experience",
  ));
  // Retired URLs show only approved content, without indexing duplicate profiles.
  await writeFile("dist/404.html", applyMetadata(home, "notFound"));
  await writeFile("dist/sitemap.xml", renderSitemap());
} finally {
  await server.close();
}

await checkRelease();
