import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "integration",
          include: ["test/integration/**/*.int.test.ts"],
          environment: "node",
          globalSetup: ["test/helpers/global-setup.ts"],
          // Test files share one database container, so run them one at a time.
          fileParallelism: false,
          hookTimeout: 120_000,
          testTimeout: 30_000,
        },
      },
    ],
  },
});
