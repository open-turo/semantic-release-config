import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "~/": new URL("./src/", import.meta.url).pathname,
      "~test/": new URL("./test/", import.meta.url).pathname,
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reportsDirectory: "reports/coverage",
    },
    setupFiles: ["./test/setup-tests.ts"],
  },
});
