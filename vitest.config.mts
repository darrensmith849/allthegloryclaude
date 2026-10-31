import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests for the /agency platform (src/platform).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/agency/unit/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/agency/unit/**/*.test.ts"],
    environment: "node",
  },
});
