import { defineConfig } from "vitest/config";

// Tests that talk to a REAL database, kept out of `npm test` (vitest.config.js
// only includes tests/). Run from server/:  npm run test:db
//
// This file is evaluated in the process that was started with --env-file, so
// the check here sees the real flags. Prisma Client loads server/.env by itself
// when DATABASE_URL is unset, so refusing to start without .env.test is what
// keeps these tests off the live database.
const loadedTestEnv = process.execArgv.includes("--env-file=.env.test");
if (!loadedTestEnv || !process.env.DATABASE_URL) {
  throw new Error(
    "Database tests run only against the test database: " +
      "node --env-file=.env.test node_modules/vitest/vitest.mjs run --config vitest.db.config.js"
  );
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests-db/**/*.db.test.js"],
    // One database, shared state: files must not run against it at once.
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-only-secret",
    },
  },
});
