import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      include: ["src/**"],
      exclude: ["src/index.ts", "src/bindings.ts"],
    },
  },
});
