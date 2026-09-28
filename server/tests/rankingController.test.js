// The ranking endpoints, driven through the real app with supertest and a mocked
// Prisma client: no database, no network.
//
// Two things this file is responsible for. First, that chest's contract did not
// move: the client's LiftRankForm posts { lifts } and reads .tier and .score off
// the response, and the cooldown still answers 403 with the same message.
// Second, that the Prompt 3 changes are actually wired up — invalid input is
// refused before the cooldown is spent, and POST /api/rank/back answers 200
// without writing anything.

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { MS_PER_HOUR, RANK_COOLDOWN_HOURS } from "../config/constants.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    muscleRank: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

const ALLOWED_ORIGIN = "http://localhost:5173";
const USER_ID = 7;

// Heroic-anchor chest lifts and Heroic-anchor back lifts: real anchor data, so
// the expected tiers below are the engine's own definition of that tier.
const CHEST_LIFTS = {
  bench: { weight: 135, reps: 8 },
  incline_db: { weight: 45, reps: 8 },
  cable: { weight: 20, reps: 12 },
};
const BACK_LIFTS = {
  lat_pulldown: { weight: 130, reps: 8 },
  db_row: { weight: 65, reps: 8 },
  deadlift: { weight: 225, reps: 5 },
};

function token() {
  return jwt.sign({ id: USER_ID, email: "lifter@example.com" }, process.env.JWT_SECRET);
}

let app;

beforeEach(() => {
  vi.clearAllMocks();
  app = createApp({ clientOrigins: [ALLOWED_ORIGIN] });
  // The controller logs the whole error on a 500; the suite should not.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function postChest(lifts, headers = { Authorization: `Bearer ${token()}` }) {
  return request(app).post("/api/rank/chest").set(headers).send({ lifts });
}

describe("POST /api/rank/chest", () => {
  it("saves and returns the rank, in the shape the client already reads", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: USER_ID, lastChestRankAt: null });
    // The row the client receives is whatever the database returns, so the mock
    // returns a realistic row rather than an echo of the input.
    const row = {
      id: 42,
      userId: USER_ID,
      muscle: "CHEST",
      tier: "HEROIC",
      score: 940,
      createdAt: "2026-09-28T00:00:00.000Z",
      updatedAt: "2026-09-28T00:00:00.000Z",
    };
    prisma.muscleRank.upsert.mockResolvedValue(row);
    prisma.user.update.mockResolvedValue({});

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(row);
    // What LiftRankForm renders.
    expect(res.body.tier).toBe("HEROIC");
    expect(res.body.score).toBe(940);

    // The tier is stored as the uppercase enum and the score as the integer the
    // engine classified it from: 939.6 raw, rounded once, in the engine.
    expect(prisma.muscleRank.upsert).toHaveBeenCalledWith({
      where: { userId_muscle: { userId: USER_ID, muscle: "CHEST" } },
      update: { tier: "HEROIC", score: 940 },
      create: { userId: USER_ID, muscle: "CHEST", tier: "HEROIC", score: 940 },
    });
  });

  it("stamps the cooldown column after a successful rank", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: USER_ID, lastChestRankAt: null });
    prisma.muscleRank.upsert.mockResolvedValue({ tier: "HEROIC", score: 940 });
    prisma.user.update.mockResolvedValue({});

    await postChest(CHEST_LIFTS);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { lastChestRankAt: expect.any(Date) },
    });
  });

  it("answers 403 with the same message while the cooldown is running", async () => {
    // One hour inside the window.
    const lastRankedAt = new Date(Date.now() - (RANK_COOLDOWN_HOURS - 1) * MS_PER_HOUR);
    prisma.user.findUnique.mockResolvedValue({ id: USER_ID, lastChestRankAt: lastRankedAt });

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Chest ranking locked. Try again later." });
    expect(prisma.muscleRank.upsert).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("allows a re-rank once the cooldown has elapsed", async () => {
    const lastRankedAt = new Date(Date.now() - (RANK_COOLDOWN_HOURS + 1) * MS_PER_HOUR);
    prisma.user.findUnique.mockResolvedValue({ id: USER_ID, lastChestRankAt: lastRankedAt });
    prisma.muscleRank.upsert.mockResolvedValue({ tier: "HEROIC", score: 940 });
    prisma.user.update.mockResolvedValue({});

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(200);
    expect(prisma.muscleRank.upsert).toHaveBeenCalledTimes(1);
  });

  it("answers 401 without a token and never touches the database", async () => {
    const res = await request(app).post("/api/rank/chest").send({ lifts: CHEST_LIFTS });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Missing or malformed authorization header." });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("answers 500 with the existing message when the database fails", async () => {
    prisma.user.findUnique.mockRejectedValue(new Error("connection refused"));

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to rank chest" });
  });
});

describe("POST /api/rank/chest with invalid input", () => {
  // The cooldown is the thing being protected here: a rejected request must not
  // cost the user a ranking attempt, so validation runs before any read.
  it.each([
    ["no lifts at all", undefined],
    ["an empty lift set", {}],
    ["a partial lift set", { bench: { weight: 135, reps: 8 } }],
    ["the 99999 lb x 99 exploit", { bench: { weight: 99999, reps: 99 } }],
    ["the 15 lb x 100 reps exploit", { incline_db: { weight: 15, reps: 100 } }],
    ["the bench-only 415 lb single", { bench: { weight: 415, reps: 1 } }],
    ["a string where a lift set belongs", "bench 135x8"],
    ["an unknown lift", { ...CHEST_LIFTS, squat: { weight: 200, reps: 5 } }],
    ["fractional reps", { ...CHEST_LIFTS, bench: { weight: 135, reps: 7.5 } }],
    ["a NaN weight", { ...CHEST_LIFTS, bench: { weight: Number.NaN, reps: 8 } }],
  ])("answers 400 for %s, before reading the user", async (_label, lifts) => {
    const res = await postChest(lifts);

    expect(res.status).toBe(400);
    // Same style as the other controllers: a single `error` string the client's
    // api.js can show, plus the full list.
    expect(typeof res.body.error).toBe("string");
    expect(res.body.error.length).toBeGreaterThan(0);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(res.body.error).toBe(res.body.errors.join(" "));

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.muscleRank.upsert).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("names every problem in the response", async () => {
    const res = await postChest({ bench: { weight: 2000, reps: 40 } });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([
      'Weight for "bench" must be between 1 and 1000 lb.',
      'Reps for "bench" must be between 1 and 30.',
      'Missing lift "incline_db". Every lift is required.',
      'Missing lift "cable". Every lift is required.',
    ]);
  });

  it("is refused even when the cooldown would have allowed it", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: USER_ID, lastChestRankAt: null });

    const res = await postChest({});

    expect(res.status).toBe(400);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe("POST /api/rank/back", () => {
  // This endpoint answered 500 for every request before Prompt 3: rankBack called
  // computeBackTier and the controller never imported it.
  it("returns a tier and score, and saves nothing", async () => {
    const res = await request(app)
      .post("/api/rank/back")
      .set("Authorization", `Bearer ${token()}`)
      .send({ lifts: BACK_LIFTS });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ muscle: "back", tier: "Heroic", score: 2887 });

    // The approved decision: no persistence and no cooldown until Enhancement 3
    // gives the schema a per-muscle column.
    expect(prisma.muscleRank.upsert).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("is not rate limited by chest's cooldown, however recently chest was ranked", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: USER_ID,
      lastChestRankAt: new Date(),
    });

    const first = await request(app)
      .post("/api/rank/back")
      .set("Authorization", `Bearer ${token()}`)
      .send({ lifts: BACK_LIFTS });
    const second = await request(app)
      .post("/api/rank/back")
      .set("Authorization", `Bearer ${token()}`)
      .send({ lifts: BACK_LIFTS });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body).toEqual(first.body);
  });

  it("answers 400 for invalid input, with back's own lift names", async () => {
    const res = await request(app)
      .post("/api/rank/back")
      .set("Authorization", `Bearer ${token()}`)
      .send({ lifts: { deadlift: { weight: 600, reps: 1 } } });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([
      'Missing lift "lat_pulldown". Every lift is required.',
      'Missing lift "db_row". Every lift is required.',
    ]);
  });

  it("answers 401 without a token", async () => {
    const res = await request(app).post("/api/rank/back").send({ lifts: BACK_LIFTS });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Missing or malformed authorization header." });
  });
});

describe("GET /api/rank/chest/me", () => {
  // Unchanged by Prompt 3, covered here because LiftRankForm calls it on mount
  // and the route file was touched.
  it("returns the stored rank", async () => {
    prisma.muscleRank.findUnique.mockResolvedValue({
      muscle: "CHEST",
      tier: "HEROIC",
      score: 940,
      userId: USER_ID,
    });

    const res = await request(app)
      .get("/api/rank/chest/me")
      .set("Authorization", `Bearer ${token()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ muscle: "CHEST", tier: "HEROIC", score: 940 });
  });

  it("returns null when the user has never been ranked", async () => {
    prisma.muscleRank.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/rank/chest/me")
      .set("Authorization", `Bearer ${token()}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it("answers 401 without a token", async () => {
    const res = await request(app).get("/api/rank/chest/me");
    expect(res.status).toBe(401);
  });
});
