import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
      include: [
        "src/lib/**/*.ts",
        "scripts/sync-blog.mjs",
        "scripts/remark-inline-diagrams.mjs",
        "scripts/content-freshness.mjs",
        "scripts/backfill-logic.mjs",
      ],
      exclude: ["**/*.test.ts", "**/*.test.mjs"],
      thresholds: {
        lines: 95,
        statements: 95,
        functions: 95,
        branches: 95,
      },
    },
  },
});
