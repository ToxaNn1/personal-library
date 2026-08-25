import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-chars",
      BETTER_AUTH_URL: "http://localhost:3001",
    },
  },
});
