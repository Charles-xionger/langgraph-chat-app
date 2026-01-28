import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./__tests__/setup/vitest.setup.ts"],
    include: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/app/generated/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "app/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
        "services/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.d.ts",
        "**/node_modules/**",
        "**/__tests__/**",
        "**/app/generated/**",
      ],
      // 暂时注释掉全局阈值，待更多测试后再启用
      // thresholds: {
      //   branches: 50,
      //   functions: 50,
      //   lines: 50,
      //   statements: 50,
      // },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
