import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const publicSources = new Set([
  "src/main.jsx",
  "src/App.jsx",
  "src/App.css",
  "src/index.css",
  "src/profile.js",
]);

export default defineConfig({
  plugins: [
    react(),
    {
      name: "public-profile-boundary",
      generateBundle(_options, bundle) {
        for (const output of Object.values(bundle)) {
          if (output.type !== "chunk") continue;
          for (const id of output.moduleIds) {
            const relative = path.relative(process.cwd(), id.split("?")[0]).replaceAll("\\", "/");
            const dependencyOrRuntime = id.startsWith("\0") || relative.startsWith("node_modules/");
            if (!dependencyOrRuntime && relative !== "index.html" && !publicSources.has(relative)) {
              this.error(`Release blocked: unapproved source module ${relative}`);
            }
          }
        }
      },
    },
  ],
  base: process.env.BASE_PATH || "/",
  publicDir: "site-public",
  build: {
    sourcemap: false,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.js"],
    include: ["src/App.test.jsx", "scripts/release.test.js"],
  },
});
