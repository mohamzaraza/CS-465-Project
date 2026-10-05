// The ranking endpoints, driven through the real app with supertest and a mocked
// Prisma client: no database, no network.
//
// Two things this file is responsible for. First, that chest's contract did not
// move: the client's LiftRankForm posts { lifts } and reads .tier and .score off
// the response, and the cooldown still answers 403 with the same message.
// Second, that the Enhancement 3 changes are wired up: the cooldown lives on the
// MuscleRank row and is spent by one conditional update, the tier is derived
// from the score, and back now saves with a cooldown of its own.
//
// The mock decides whether the conditional update matched; whether Postgres
// really applies the WHERE clause atomically is a database property, so what is
// asserted here is the exact condition sent to it.

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { rankAttemptLogData } from "../controllers/rankingController.js";
import { MS_PER_HOUR, RANK_COOLDOWN_HOURS } from "../config/constants.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    muscleRank: { findUnique: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
  },
}));

const ALLOWED_ORIGIN = "http://localhost:5173";
const USER_ID = 7;

// Only Date is faked, so supertest's real timers and sockets are untouched while
// "now", and therefore the cooldown cutoff, is exact.
const NOW = new Date("2026-10-05T12:00:00.000Z");
const COOLDOWN_CUTOFF = new Date(NOW.getTime() - RANK_COOLDOWN_HOURS * MS_PER_HOUR);

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

const UNIQUE_VIOLATION = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });

// A realistic MuscleRank row as the database returns it after the save: the
// real columns, including lastRankedAt, and no tier column.
function savedRow(muscle, score) {
  return {
    id: `rank-${muscle}`,
    userId: USER_ID,
    muscle,
    score,
    updatedAt: NOW,
    lastRankedAt: NOW,
  };
}

function token() {
  return jwt.sign({ id: USER_ID, email: "lifter@example.com" }, process.env.JWT_SECRET);
}

let app;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  app = createApp({ clientOrigins: [ALLOWED_ORIGIN] });
  // The controller logs the whole error on a 500; the suite should not.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function postChest(lifts, headers = { Authorization: `Bearer ${token()}` }) {
  return request(app).post("/api/rank/chest").set(headers).send({ lifts });
}

function postBack(lifts, headers = { Authorization: `Bearer ${token()}` }) {
  return request(app).post("/api/rank/back").set(headers).send({ lifts });
}

describe("POST /api/rank/chest", () => {
  it("saves and returns the rank, in the shape the client already reads", async () => {
    prisma.muscleRank.updateMany.mockResolvedValue({ count: 1 });
    prisma.muscleRank.findUnique.mockResolvedValue(savedRow("CHEST", 940));

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(200);
    // The saved row's fields with the tier re-derived from the score, and
    // nothing else: lastRankedAt is new and stays out of the response.
    expect(res.body).toEqual({
      id: "rank-CHEST",
      userId: USER_ID,
      muscle: "CHEST",
      tier: "HEROIC",
      score: 940,
      updatedAt: NOW.toISOString(),
    });
    // What LiftRankForm renders.
    expect(res.body.tier).toBe("HEROIC");
    expect(res.body.score).toBe(940);

    expect(prisma.muscleRank.findUnique).toHaveBeenCalledWith({
      where: { userId_muscle: { userId: USER_ID, muscle: "CHEST" } },
    });
  });

  it("spends the cooldown and saves the score in one conditional update", async () => {
    prisma.muscleRank.updateMany.mockResolvedValue({ count: 1 });
    prisma.muscleRank.findUnique.mockResolvedValue(savedRow("CHEST", 940));

    await postChest(CHEST_LIFTS);

    // The score is the integer the engine classified the tier from (939.6 raw,
    // rounded once, in the engine). No tier is written: the column is derived.
    // The WHERE clause is the cooldown check, so the check and the write cannot
    // be separated by a concurrent request.
    expect(prisma.muscleRank.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.muscleRank.updateMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, muscle: "CHEST", lastRankedAt: { lte: COOLDOWN_CUTOFF } },
      data: { score: 940, lastRankedAt: NOW },
    });
    // An existing row was updated, so there is nothing to create.
    expect(prisma.muscleRank.create).not.toHaveBeenCalled();
  });

  it("allows a re-rank exactly when the cooldown has elapsed, not before", async () => {
    // lte, not lt: a row stamped exactly RANK_COOLDOWN_HOURS ago matches, as the
    // old `hoursSince < RANK_COOLDOWN_HOURS` lock released it.
    prisma.muscleRank.updateMany.mockResolvedValue({ count: 1 });
    prisma.muscleRank.findUnique.mockResolvedValue(savedRow("CHEST", 940));

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(200);
    const { where } = prisma.muscleRank.updateMany.mock.calls[0][0];
    expect(Object.keys(where.lastRankedAt)).toEqual(["lte"]);
    expect(NOW.getTime() - where.lastRankedAt.lte.getTime()).toBe(RANK_COOLDOWN_HOURS * MS_PER_HOUR);
  });

  it("creates the row, with the cooldown stamped, on a user's first chest rank", async () => {
    // No row matched the update because none exists yet.
    prisma.muscleRank.updateMany.mockResolvedValue({ count: 0 });
    prisma.muscleRank.create.mockResolvedValue(savedRow("CHEST", 940));
    prisma.muscleRank.findUnique.mockResolvedValue(savedRow("CHEST", 940));

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(200);
    expect(res.body.tier).toBe("HEROIC");
    expect(res.body.score).toBe(940);
    expect(prisma.muscleRank.create).toHaveBeenCalledWith({
      data: { userId: USER_ID, muscle: "CHEST", score: 940, lastRankedAt: NOW },
    });
  });

  it("answers 403 with the same message while the cooldown is running", async () => {
    // The row exists (the create hits the unique constraint) but the update did
    // not match it, so it was ranked inside the cooldown window.
    prisma.muscleRank.updateMany.mockResolvedValue({ count: 0 });
    prisma.muscleRank.create.mockRejectedValue(UNIQUE_VIOLATION);

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Chest ranking locked. Try again later." });
    // Nothing was saved, so there is no row to read back.
    expect(prisma.muscleRank.findUnique).not.toHaveBeenCalled();
  });

  it("answers 401 without a token and never touches the database", async () => {
    const res = await request(app).post("/api/rank/chest").send({ lifts: CHEST_LIFTS });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Missing or malformed authorization header." });
    expect(prisma.muscleRank.updateMany).not.toHaveBeenCalled();
    expect(prisma.muscleRank.create).not.toHaveBeenCalled();
    expect(prisma.muscleRank.findUnique).not.toHaveBeenCalled();
  });

  it("answers 500 with the existing message when the database fails", async () => {
    prisma.muscleRank.updateMany.mockRejectedValue(new Error("connection refused"));

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to rank chest" });
  });

  it("answers 500, not 403, when the create fails for any reason but an existing row", async () => {
    // e.g. a token for a user whose row no longer exists (foreign key, P2003):
    // only P2002 means "already ranked".
    prisma.muscleRank.updateMany.mockResolvedValue({ count: 0 });
    prisma.muscleRank.create.mockRejectedValue(
      Object.assign(new Error("Foreign key constraint failed"), { code: "P2003" })
    );

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to rank chest" });
  });
});

describe("POST /api/rank/chest with invalid input", () => {
  // The cooldown is the thing being protected here: a rejected request must not
  // cost the user a ranking attempt, so validation runs before any database call.
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
  ])("answers 400 for %s, before touching the database", async (_label, lifts) => {
    const res = await postChest(lifts);

    expect(res.status).toBe(400);
    // Same style as the other controllers: a single `error` string the client's
    // api.js can show, plus the full list.
    expect(typeof res.body.error).toBe("string");
    expect(res.body.error.length).toBeGreaterThan(0);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(res.body.error).toBe(res.body.errors.join(" "));

    expect(prisma.muscleRank.updateMany).not.toHaveBeenCalled();
    expect(prisma.muscleRank.create).not.toHaveBeenCalled();
    expect(prisma.muscleRank.findUnique).not.toHaveBeenCalled();
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
    prisma.muscleRank.updateMany.mockResolvedValue({ count: 1 });

    const res = await postChest({});

    expect(res.status).toBe(400);
    expect(prisma.muscleRank.updateMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/rank/back", () => {
  // Back computed a rank without saving it until Enhancement 3, because the only
  // cooldown column was chest's. It now saves exactly like chest.
  it("saves and returns the rank in the same shape as chest", async () => {
    prisma.muscleRank.updateMany.mockResolvedValue({ count: 1 });
    prisma.muscleRank.findUnique.mockResolvedValue(savedRow("BACK", 2887));

    const res = await postBack(BACK_LIFTS);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: "rank-BACK",
      userId: USER_ID,
      muscle: "BACK",
      tier: "HEROIC",
      score: 2887,
      updatedAt: NOW.toISOString(),
    });
    expect(prisma.muscleRank.updateMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, muscle: "BACK", lastRankedAt: { lte: COOLDOWN_CUTOFF } },
      data: { score: 2887, lastRankedAt: NOW },
    });
  });

  it("uses its own cooldown row, never chest's", async () => {
    prisma.muscleRank.updateMany.mockResolvedValue({ count: 1 });
    prisma.muscleRank.findUnique.mockResolvedValue(savedRow("BACK", 2887));

    await postBack(BACK_LIFTS);

    for (const [args] of prisma.muscleRank.updateMany.mock.calls) {
      expect(args.where.muscle).toBe("BACK");
    }
    expect(prisma.muscleRank.findUnique).toHaveBeenCalledWith({
      where: { userId_muscle: { userId: USER_ID, muscle: "BACK" } },
    });
  });

  it("answers 403 with its own message while its cooldown is running", async () => {
    prisma.muscleRank.updateMany.mockResolvedValue({ count: 0 });
    prisma.muscleRank.create.mockRejectedValue(UNIQUE_VIOLATION);

    const res = await postBack(BACK_LIFTS);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Back ranking locked. Try again later." });
  });

  it("answers 400 for invalid input, with back's own lift names", async () => {
    const res = await postBack({ deadlift: { weight: 600, reps: 1 } });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([
      'Missing lift "lat_pulldown". Every lift is required.',
      'Missing lift "db_row". Every lift is required.',
    ]);
    expect(prisma.muscleRank.updateMany).not.toHaveBeenCalled();
  });

  it("answers 401 without a token", async () => {
    const res = await request(app).post("/api/rank/back").send({ lifts: BACK_LIFTS });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Missing or malformed authorization header." });
  });
});

describe("GET /api/rank/chest/me", () => {
  // LiftRankForm calls this on mount.
  it("returns the stored rank, with the tier derived from the score", async () => {
    prisma.muscleRank.findUnique.mockResolvedValue({ muscle: "CHEST", score: 940 });

    const res = await request(app)
      .get("/api/rank/chest/me")
      .set("Authorization", `Bearer ${token()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ muscle: "CHEST", tier: "HEROIC", score: 940 });
    expect(prisma.muscleRank.findUnique).toHaveBeenCalledWith({
      where: { userId_muscle: { userId: USER_ID, muscle: "CHEST" } },
      select: { muscle: true, score: true },
    });
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

describe("rankAttemptLogData (not written yet: Prompt 4)", () => {
  it("builds one history row with one entry per lift, in pounds", () => {
    expect(rankAttemptLogData(USER_ID, "CHEST", CHEST_LIFTS, 940)).toEqual({
      userId: USER_ID,
      muscle: "CHEST",
      score: 940,
      weightUnit: "LB",
      entries: {
        create: [
          { liftKey: "bench", weight: 135, reps: 8 },
          { liftKey: "incline_db", weight: 45, reps: 8 },
          { liftKey: "cable", weight: 20, reps: 12 },
        ],
      },
    });
  });

  it("is not called by any rank handler yet", async () => {
    // Guards the TODO: nothing may write history until Migration 2 has dropped
    // the old NOT NULL columns. The mock has no userLiftsLog at all, so any
    // attempt would throw and turn this 200 into a 500.
    prisma.muscleRank.updateMany.mockResolvedValue({ count: 1 });
    prisma.muscleRank.findUnique.mockResolvedValue(savedRow("CHEST", 940));

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(200);
    expect(prisma.userLiftsLog).toBeUndefined();
  });
});
