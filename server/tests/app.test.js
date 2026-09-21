import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { askKevAi } from "../services/openaiService.js";
import { CHAT_MAX_LENGTH, KEVAI_RATE_LIMIT_MAX } from "../config/constants.js";

// No database and no OpenAI: every test runs offline.
vi.mock("../lib/prisma.js", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    muscleRank: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
  },
}));

vi.mock("../services/openaiService.js", () => ({
  askKevAi: vi.fn(),
}));

// chestRanking.js and chestTierAnchors.js import each other. Native Node
// resolves that cycle, but Vite's module transform turns it into a
// temporal-dead-zone error. The ranking engine is not under test here
// (and is out of scope for this enhancement), so it is replaced.
vi.mock("../src/ranking/chestRanking.js", () => ({
  computeChestTier: vi.fn(),
}));

const ALLOWED_ORIGIN = "http://localhost:5173";

function tokenFor(id) {
  return jwt.sign({ id, email: `user${id}@example.com` }, process.env.JWT_SECRET);
}

let app;

beforeEach(() => {
  vi.clearAllMocks();
  askKevAi.mockResolvedValue("Train hard.");
  // A fresh app per test also means a fresh rate-limit counter.
  app = createApp({ clientOrigins: [ALLOWED_ORIGIN] });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/kevai", () => {
  it("answers 401 without a token and never reaches the model", async () => {
    const res = await request(app).post("/api/kevai").send({ message: "Hi" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Missing or malformed authorization header." });
    expect(askKevAi).not.toHaveBeenCalled();
  });

  it("returns the reply for a valid message", async () => {
    const res = await request(app)
      .post("/api/kevai")
      .set("Authorization", `Bearer ${tokenFor(1)}`)
      .send({ message: "How do I bench more?" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ reply: "Train hard." });
    expect(askKevAi).toHaveBeenCalledWith("How do I bench more?");
  });

  it.each([
    ["an empty message", "", "Message is required."],
    ["a whitespace-only message", "   ", "Message is required."],
    ["a 2000-character message", "x".repeat(2000), `Message must be at most ${CHAT_MAX_LENGTH} characters.`],
  ])("answers 400 for %s", async (_name, message, error) => {
    const res = await request(app)
      .post("/api/kevai")
      .set("Authorization", `Bearer ${tokenFor(1)}`)
      .send({ message });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error });
    expect(askKevAi).not.toHaveBeenCalled();
  });

  it("answers 429 once a user exceeds the limit, without affecting other users", async () => {
    const auth = `Bearer ${tokenFor(1)}`;

    for (let i = 0; i < KEVAI_RATE_LIMIT_MAX; i++) {
      const ok = await request(app).post("/api/kevai").set("Authorization", auth).send({ message: "Hi" });
      expect(ok.status).toBe(200);
    }

    const limited = await request(app).post("/api/kevai").set("Authorization", auth).send({ message: "Hi" });
    expect(limited.status).toBe(429);
    expect(limited.body.error).toMatch(/Too many KevAi messages/);
    expect(askKevAi).toHaveBeenCalledTimes(KEVAI_RATE_LIMIT_MAX);

    // The limit is per account, so another user on the same IP is unaffected.
    const other = await request(app)
      .post("/api/kevai")
      .set("Authorization", `Bearer ${tokenFor(2)}`)
      .send({ message: "Hi" });
    expect(other.status).toBe(200);
  });
});

describe("CORS", () => {
  it("allows the configured client origin", async () => {
    const res = await request(app).get("/").set("Origin", ALLOWED_ORIGIN);

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
  });

  it("allows requests without an Origin header", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
  });

  it("rejects an unknown origin", async () => {
    const res = await request(app).get("/").set("Origin", "https://evil.example");

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Origin not allowed" });
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("POST /api/auth/register", () => {
  it("answers 400 for a bad email without touching the database", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "longenough" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Enter a valid email address." });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("answers 400 for a short password without touching the database", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@b.co", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Password must be at least 8 characters." });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("answers 400 when there is no body at all", async () => {
    const res = await request(app).post("/api/auth/register");
    expect(res.status).toBe(400);
  });

  it("routes a database failure to the central error handler as JSON", async () => {
    prisma.user.findUnique.mockRejectedValue(new Error("connection refused"));

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@b.co", password: "longenough" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "connection refused" });
  });
});

describe("fallbacks", () => {
  it("answers unknown routes with a JSON 404", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
  });

  it("answers malformed JSON with a 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{not json");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Request body is not valid JSON." });
  });
});
