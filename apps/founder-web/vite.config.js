import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root,
  plugins: [react()],
  base: "/founder/",
  build: {
    outDir: path.resolve(root, "../../founder-dist"),
    emptyOutDir: true,
    sourcemap: false,
  },
});
