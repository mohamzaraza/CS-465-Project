import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // prisma/ holds generated and migration files owned by Enhancement 3.
  globalIgnores(["node_modules", "prisma"]),
  {
    files: ["**/*.{js,mjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      // Express middleware is told apart by its parameter count, so some
      // signatures must keep a parameter they never read; "_" marks those.
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
]);
