import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    // Tests never load server/.env; a throwaway secret lets them sign and
    // verify real JWTs.
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-only-secret",
    },
  },
});
