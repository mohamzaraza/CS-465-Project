// The ranking endpoints, driven through the real app with supertest and a mocked
// Prisma client: no database, no network.
//
// Two things this file is responsible for. First, that chest's contract did not
// move: the client's LiftRankForm posts { lifts } and reads .tier and .score off
// the response, and the cooldown still answers 403 with the same message.
// Second, that the Enhancement 3 changes are wired up: the cooldown lives on the
// MuscleRank row and is spent by one conditional update, the tier is derived
// from the score, back saves with a cooldown of its own, and every saved rank
// is logged to UserLiftsLog in the same transaction.
//
// The mock decides what each statement returns; how Postgres really behaves
// (atomicity, conflicts inside a transaction, rollback) is a database property,
// pinned against the real test database in tests-db/ranking.db.test.js. What is
// asserted here is the exact statements sent, and that every write goes through
// the transaction client rather than the global one.

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { rankAttemptLogData } from "../controllers/rankingController.js";
import { MS_PER_HOUR, RANK_COOLDOWN_HOURS } from "../config/constants.js";

// The client handed to the $transaction callback. Kept separate from `prisma`
// so a write made outside the transaction would hit the global mock instead,
// which has no write methods at all, and fail the test.
const tx = vi.hoisted(() => ({
  muscleRank: { updateMany: vi.fn(), createMany: vi.fn(), findUnique: vi.fn() },
  userLiftsLog: { create: vi.fn() },
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    $transaction: vi.fn(),
    // Only the read GET /api/rank/chest/me makes outside a transaction.
    muscleRank: { findUnique: vi.fn() },
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

// The three outcomes of the save. `updateCount` is how many rows the
// conditional UPDATE matched; `insertCount` how many the insert-if-absent
// wrote (0 = the row already existed, i.e. the cooldown is running).
function existingRowCooledDown(muscle, score) {
  tx.muscleRank.updateMany.mockResolvedValue({ count: 1 });
  tx.muscleRank.findUnique.mockResolvedValue(savedRow(muscle, score));
  tx.userLiftsLog.create.mockResolvedValue({});
}
function firstRank(muscle, score) {
  tx.muscleRank.updateMany.mockResolvedValue({ count: 0 });
  tx.muscleRank.createMany.mockResolvedValue({ count: 1 });
  tx.muscleRank.findUnique.mockResolvedValue(savedRow(muscle, score));
  tx.userLiftsLog.create.mockResolvedValue({});
}
function cooldownRunning() {
  tx.muscleRank.updateMany.mockResolvedValue({ count: 0 });
  // ON CONFLICT DO NOTHING: a conflict is 0 rows written, not an error.
  tx.muscleRank.createMany.mockResolvedValue({ count: 0 });
}

function token() {
  return jwt.sign({ id: USER_ID, email: "lifter@example.com" }, process.env.JWT_SECRET);
}

function expectNoWrites() {
  expect(tx.muscleRank.updateMany).not.toHaveBeenCalled();
  expect(tx.muscleRank.createMany).not.toHaveBeenCalled();
  expect(tx.userLiftsLog.create).not.toHaveBeenCalled();
  expect(prisma.$transaction).not.toHaveBeenCalled();
}

let app;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  // A transaction that runs the callback with the tx client and passes on
  // whatever it returns or throws, as Prisma's interactive transaction does.
  prisma.$transaction.mockImplementation((callback) => callback(tx));
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
    existingRowCooledDown("CHEST", 940);

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

    // Read back inside the same transaction that wrote it.
    expect(tx.muscleRank.findUnique).toHaveBeenCalledWith({
      where: { userId_muscle: { userId: USER_ID, muscle: "CHEST" } },
    });
  });

  it("spends the cooldown and saves the score in one conditional update", async () => {
    existingRowCooledDown("CHEST", 940);

    await postChest(CHEST_LIFTS);

    // The score is the integer the engine classified the tier from (939.6 raw,
    // rounded once, in the engine). No tier is written: the column is derived.
    // The WHERE clause is the cooldown check, so the check and the write cannot
    // be separated by a concurrent request.
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.muscleRank.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.muscleRank.updateMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, muscle: "CHEST", lastRankedAt: { lte: COOLDOWN_CUTOFF } },
      data: { score: 940, lastRankedAt: NOW },
    });
    // An existing row was updated, so there is nothing to insert.
    expect(tx.muscleRank.createMany).not.toHaveBeenCalled();
  });

  it("allows a re-rank exactly when the cooldown has elapsed, not before", async () => {
    // lte, not lt: a row stamped exactly RANK_COOLDOWN_HOURS ago matches, as the
    // old `hoursSince < RANK_COOLDOWN_HOURS` lock released it.
    existingRowCooledDown("CHEST", 940);

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(200);
    const { where } = tx.muscleRank.updateMany.mock.calls[0][0];
    expect(Object.keys(where.lastRankedAt)).toEqual(["lte"]);
    expect(NOW.getTime() - where.lastRankedAt.lte.getTime()).toBe(RANK_COOLDOWN_HOURS * MS_PER_HOUR);
  });

  it("inserts the row, with the cooldown stamped, on a user's first chest rank", async () => {
    firstRank("CHEST", 940);

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(200);
    expect(res.body.tier).toBe("HEROIC");
    expect(res.body.score).toBe(940);
    expect(tx.muscleRank.createMany).toHaveBeenCalledWith({
      data: [{ userId: USER_ID, muscle: "CHEST", score: 940, lastRankedAt: NOW }],
      skipDuplicates: true,
    });
  });

  it("answers 403 with the same message while the cooldown is running", async () => {
    // The update matched nothing and the insert found the row already there, so
    // it was ranked inside the cooldown window.
    cooldownRunning();

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Chest ranking locked. Try again later." });
    // Nothing was saved, so nothing is logged and there is no row to read back.
    expect(tx.userLiftsLog.create).not.toHaveBeenCalled();
    expect(tx.muscleRank.findUnique).not.toHaveBeenCalled();
  });

  it("answers 401 without a token and never touches the database", async () => {
    const res = await request(app).post("/api/rank/chest").send({ lifts: CHEST_LIFTS });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Missing or malformed authorization header." });
    expectNoWrites();
  });

  it("answers 500 with the existing message when the database fails", async () => {
    tx.muscleRank.updateMany.mockRejectedValue(new Error("connection refused"));

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to rank chest" });
  });

  it("answers 500, not 403, when the insert fails for any reason but an existing row", async () => {
    // e.g. a token for a user whose row no longer exists (foreign key, P2003):
    // only "0 rows written" means "already ranked".
    tx.muscleRank.updateMany.mockResolvedValue({ count: 0 });
    tx.muscleRank.createMany.mockRejectedValue(
      Object.assign(new Error("Foreign key constraint failed"), { code: "P2003" })
    );

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to rank chest" });
    expect(tx.userLiftsLog.create).not.toHaveBeenCalled();
  });
});

describe("the save's conflict handling inside the transaction", () => {
  // The fix depends on a conflict being REPORTED (0 rows) rather than THROWN:
  // inside a Postgres transaction a thrown statement error aborts the whole
  // transaction, so the old create-and-catch-P2002 could not be followed by the
  // history insert. The real-database half of this is in
  // tests-db/ranking.db.test.js; this half pins how the controller reads it.
  it("treats an insert that writes 0 rows as the cooldown, with no error involved", async () => {
    cooldownRunning();

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(403);
    expect(tx.muscleRank.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true })
    );
    // The transaction callback resolved (null) instead of rejecting, so the
    // transaction ends cleanly rather than being torn down by an error.
    await expect(prisma.$transaction.mock.results[0].value).resolves.toBeNull();
  });

  it("does not rely on a P2002 from the insert to mean 'already ranked'", async () => {
    // The old mechanism, replayed: if the insert threw P2002 as create() did,
    // the request must fail loudly as a 500, not quietly pass as a 403, because
    // in a real transaction nothing after that error could run.
    tx.muscleRank.updateMany.mockResolvedValue({ count: 0 });
    tx.muscleRank.createMany.mockRejectedValue(
      Object.assign(new Error("Unique constraint failed"), { code: "P2002" })
    );

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(500);
    expect(tx.userLiftsLog.create).not.toHaveBeenCalled();
  });
});

describe("rank history (UserLiftsLog)", () => {
  it.each([
    ["chest, re-rank after the cooldown", "chest", existingRowCooledDown, "CHEST", CHEST_LIFTS, 940],
    ["chest, first rank", "chest", firstRank, "CHEST", CHEST_LIFTS, 940],
    ["back, re-rank after the cooldown", "back", existingRowCooledDown, "BACK", BACK_LIFTS, 2887],
    ["back, first rank", "back", firstRank, "BACK", BACK_LIFTS, 2887],
  ])("logs exactly one attempt with its lifts: %s", async (_label, muscle, setUp, muscleEnum, lifts, score) => {
    setUp(muscleEnum, score);

    const res = await (muscle === "chest" ? postChest(lifts) : postBack(lifts));

    expect(res.status).toBe(200);
    expect(tx.userLiftsLog.create).toHaveBeenCalledTimes(1);
    expect(tx.userLiftsLog.create).toHaveBeenCalledWith({
      data: rankAttemptLogData(USER_ID, muscleEnum, lifts, score),
    });
    // One entry per configured lift, nested in the same insert.
    expect(tx.userLiftsLog.create.mock.calls[0][0].data.entries.create).toHaveLength(3);
  });

  it("logs nothing while the cooldown is running", async () => {
    cooldownRunning();

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(403);
    expect(tx.userLiftsLog.create).not.toHaveBeenCalled();
  });

  it("logs nothing for invalid input", async () => {
    const res = await postChest({ bench: { weight: 135, reps: 8 } });

    expect(res.status).toBe(400);
    expectNoWrites();
  });

  it("fails the whole save when the history insert fails, so the transaction rolls back", async () => {
    existingRowCooledDown("CHEST", 940);
    tx.userLiftsLog.create.mockRejectedValue(new Error("history insert failed"));

    const res = await postChest(CHEST_LIFTS);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to rank chest" });
    // The rank update and the failed insert were made through the same
    // transaction client, and the error escaped the transaction callback,
    // which is what makes Prisma roll the update back. That it really does is
    // checked against Postgres in tests-db/ranking.db.test.js.
    expect(tx.muscleRank.updateMany).toHaveBeenCalledTimes(1);
    await expect(prisma.$transaction.mock.results[0].value).rejects.toThrow("history insert failed");
    expect(tx.muscleRank.findUnique).not.toHaveBeenCalled();
  });

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

    expectNoWrites();
    expect(tx.muscleRank.findUnique).not.toHaveBeenCalled();
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
    existingRowCooledDown("CHEST", 940);

    const res = await postChest({});

    expect(res.status).toBe(400);
    expectNoWrites();
  });
});

describe("POST /api/rank/back", () => {
  // Back computed a rank without saving it until Enhancement 3, because the only
  // cooldown column was chest's. It now saves exactly like chest.
  it("saves and returns the rank in the same shape as chest", async () => {
    existingRowCooledDown("BACK", 2887);

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
    expect(tx.muscleRank.updateMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, muscle: "BACK", lastRankedAt: { lte: COOLDOWN_CUTOFF } },
      data: { score: 2887, lastRankedAt: NOW },
    });
  });

  it("uses its own cooldown row, never chest's", async () => {
    firstRank("BACK", 2887);

    await postBack(BACK_LIFTS);

    for (const [args] of tx.muscleRank.updateMany.mock.calls) {
      expect(args.where.muscle).toBe("BACK");
    }
    for (const [args] of tx.muscleRank.createMany.mock.calls) {
      expect(args.data.map((row) => row.muscle)).toEqual(["BACK"]);
    }
    expect(tx.muscleRank.findUnique).toHaveBeenCalledWith({
      where: { userId_muscle: { userId: USER_ID, muscle: "BACK" } },
    });
  });

  it("answers 403 with its own message while its cooldown is running", async () => {
    cooldownRunning();

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
    expectNoWrites();
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
