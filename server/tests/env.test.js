import { describe, it, expect } from "vitest";
import { validateEnv } from "../config/env.js";

const REQUIRED = { DATABASE_URL: "postgresql://example", JWT_SECRET: "secret" };

describe("validateEnv", () => {
  it("lists every missing required variable in one error", () => {
    expect(() => validateEnv({})).toThrow(
      /Missing required environment variable\(s\): DATABASE_URL, JWT_SECRET/
    );
  });

  it("treats blank values as missing", () => {
    expect(() => validateEnv({ DATABASE_URL: "  ", JWT_SECRET: "secret" })).toThrow(
      /: DATABASE_URL\./
    );
  });

  it("applies the defaults when optional values are absent", () => {
    const { config } = validateEnv({ ...REQUIRED, OPENAI_API_KEY: "key" });
    expect(config.port).toBe(5000);
    expect(config.clientOrigins).toEqual(["http://localhost:5173"]);
  });

  it("warns, without failing, when OPENAI_API_KEY is missing", () => {
    const { warnings } = validateEnv(REQUIRED);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/OPENAI_API_KEY/);
    expect(validateEnv({ ...REQUIRED, OPENAI_API_KEY: "key" }).warnings).toEqual([]);
  });

  it("splits a comma-separated CLIENT_ORIGIN list and trims each entry", () => {
    const { config } = validateEnv({
      ...REQUIRED,
      CLIENT_ORIGIN: "http://localhost:5173, https://example.github.io ,",
    });
    expect(config.clientOrigins).toEqual(["http://localhost:5173", "https://example.github.io"]);
  });

  it("reads PORT as a number and rejects nonsense", () => {
    expect(validateEnv({ ...REQUIRED, PORT: "8080" }).config.port).toBe(8080);
    expect(() => validateEnv({ ...REQUIRED, PORT: "abc" })).toThrow(/PORT/);
  });
});
