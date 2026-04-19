// See docs/specs/website/nextjs-architecture.md §6.1
import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@pipeline": path.resolve(__dirname, "../scripts/lib"),
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    include: ["{lib,components,app}/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
