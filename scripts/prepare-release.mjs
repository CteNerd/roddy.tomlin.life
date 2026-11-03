import { copyFile, readFile, writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";
import { checkRelease } from "./check-release.mjs";

// Render the same public component for crawlers and visitors without JavaScript.
const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { default: App } = await server.ssrLoadModule("/src/App.jsx");
  const html = await readFile("dist/index.html", "utf8");
  await writeFile("dist/index.html", html.replace('<div id="root"></div>', `<div id="root">${renderToString(createElement(App))}</div>`));
  const experienceHtml = html
    .replaceAll("Roddy Tomlin | Engineering Leadership", "Experience | Roddy Tomlin")
    .replace(
      'content="Roddy Tomlin, Director of Software Engineering at FMG. A people-first focus on engineering leadership, platform reliability, and responsible AI."',
      'content="Explore Roddy Tomlin\'s career from the NFL to software development, architecture, and engineering leadership."',
    )
    .replace(
      'content="Build with purpose. Lead with clarity. Meet Roddy Tomlin, Director of Software Engineering at FMG."',
      'content="From the Jacksonville Jaguars and Atlanta Falcons to software engineering leadership. Explore Roddy Tomlin\'s professional experience."',
    );
  await writeFile("dist/experience.html", experienceHtml.replace('<div id="root"></div>', `<div id="root">${renderToString(createElement(App, { page: "experience" }))}</div>`));
} finally {
  await server.close();
}

// Old story URLs get a safe public profile, never an archived story body.
await copyFile("dist/index.html", "dist/404.html");
await checkRelease();
