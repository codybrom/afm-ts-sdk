import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/integration/**/*.test.ts"],
    pool: "forks",
    fileParallelism: false,
    testTimeout: 120_000,
  },
});
