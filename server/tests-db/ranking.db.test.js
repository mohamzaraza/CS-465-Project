// The rank save against the real test database: what the mocks in
// tests/rankingController.test.js can only assume, checked as Postgres actually
// behaves. Covers the conflict mechanism the save depends on, the history
// write, the rollback, and two genuinely concurrent requests.
//
// Every account here is test data: its email starts with "e3-dbtest-" and ends
// in the reserved .invalid domain, and all of it is deleted before and after.

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { saveRankAttempt } from "../controllers/rankingController.js";
import { MS_PER_HOUR, RANK_COOLDOWN_HOURS } from "../config/constants.js";

const EMAIL_PREFIX = "e3-dbtest-";
const app = createApp({ clientOrigins: [] });

// Heroic-anchor chest lifts: a valid set that scores 940.
const CHEST_LIFTS = {
  bench: { weight: 135, reps: 8 },
  incline_db: { weight: 45, reps: 8 },
  cable: { weight: 20, reps: 12 },
};

async function removeTestData() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: EMAIL_PREFIX } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  // Children first: the user foreign keys are ON DELETE RESTRICT. Log entries
  // go with their log row (CASCADE).
  await prisma.userLiftsLog.deleteMany({ where: { userId: { in: ids } } });
  await prisma.muscleRank.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

async function freshUser() {
  return prisma.user.create({
    data: { email: `${EMAIL_PREFIX}${randomUUID()}@example.invalid`, password: "not-a-real-hash" },
  });
}

function postChest(user, lifts = CHEST_LIFTS) {
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET);
  return request(app).post("/api/rank/chest").set("Authorization", `Bearer ${token}`).send({ lifts });
}

// Moves a user's chest cooldown into the past, as if they ranked hours ago.
function expireCooldown(user) {
  return prisma.muscleRank.updateMany({
    where: { userId: user.id, muscle: "CHEST" },
    data: { lastRankedAt: new Date(Date.now() - (RANK_COOLDOWN_HOURS + 1) * MS_PER_HOUR) },
  });
}

function historyFor(user) {
  return prisma.userLiftsLog.findMany({
    where: { userId: user.id },
    include: { entries: { orderBy: { liftKey: "asc" } } },
    orderBy: { timestamp: "asc" },
  });
}

beforeAll(removeTestData);

afterAll(async () => {
  await removeTestData();
  await prisma.$disconnect();
});

describe("the conflict mechanism inside a real transaction", () => {
  // The save relies on an insert conflict being reported as 0 rows, because a
  // thrown error would end the transaction before the history insert.
  it("createMany with skipDuplicates reports 0 rows on a conflict, and the transaction carries on", async () => {
    const user = await freshUser();
    await prisma.muscleRank.create({ data: { userId: user.id, muscle: "CHEST", score: 1 } });

    const outcome = await prisma.$transaction(async (tx) => {
      const inserted = await tx.muscleRank.createMany({
        data: [{ userId: user.id, muscle: "CHEST", score: 2 }],
        skipDuplicates: true,
      });
      // Still usable after the conflict.
      const rows = await tx.muscleRank.count({ where: { userId: user.id } });
      return { inserted: inserted.count, rows };
    });

    expect(outcome).toEqual({ inserted: 0, rows: 1 });
  });

  it("the old create-and-catch-P2002 leaves the transaction unusable", async () => {
    const user = await freshUser();
    await prisma.muscleRank.create({ data: { userId: user.id, muscle: "CHEST", score: 1 } });

    let caughtCode;
    const attempt = prisma.$transaction(async (tx) => {
      try {
        await tx.muscleRank.create({ data: { userId: user.id, muscle: "CHEST", score: 2 } });
      } catch (err) {
        caughtCode = err.code;
      }
      // What the save would do next: write the history row.
      await tx.userLiftsLog.create({ data: { userId: user.id, muscle: "CHEST", score: 2 } });
    });

    await expect(attempt).rejects.toThrow(/current transaction is aborted/);
    expect(caughtCode).toBe("P2002");
    expect(await prisma.userLiftsLog.count({ where: { userId: user.id } })).toBe(0);
  });
});

describe("rank history against the real database", () => {
  it("logs one attempt with its lifts on the first rank and on a re-rank, and none while locked", async () => {
    const user = await freshUser();

    // First rank: the insert path.
    expect((await postChest(user)).status).toBe(200);
    let history = await historyFor(user);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ muscle: "CHEST", score: 940, weightUnit: "LB" });
    expect(history[0].entries.map(({ liftKey, weight, reps }) => ({ liftKey, weight, reps }))).toEqual([
      { liftKey: "bench", weight: 135, reps: 8 },
      { liftKey: "cable", weight: 20, reps: 12 },
      { liftKey: "incline_db", weight: 45, reps: 8 },
    ]);

    // Inside the cooldown: refused, nothing logged.
    expect((await postChest(user)).status).toBe(403);
    expect(await historyFor(user)).toHaveLength(1);

    // As if 13 hours passed: the conditional-update path.
    await expireCooldown(user);
    const heavier = { ...CHEST_LIFTS, bench: { weight: 185, reps: 5 } };
    const rerank = await postChest(user, heavier);
    expect(rerank.status).toBe(200);

    history = await historyFor(user);
    expect(history).toHaveLength(2);
    expect(history[1].score).toBe(rerank.body.score);
    expect(history[1].entries.find((e) => e.liftKey === "bench")).toMatchObject({ weight: 185, reps: 5 });
    expect(await prisma.muscleRank.count({ where: { userId: user.id } })).toBe(1);
  });

  it("rolls back the rank update when the history insert fails", async () => {
    const user = await freshUser();
    expect((await postChest(user)).status).toBe(200);
    await expireCooldown(user);
    const before = await prisma.muscleRank.findUnique({
      where: { userId_muscle: { userId: user.id, muscle: "CHEST" } },
    });

    // A weight of 0 can never come through the API (validateLifts refuses it),
    // so this calls the save directly to make the history insert break the
    // positive-value CHECK, after the rank update has already run.
    const broken = { ...CHEST_LIFTS, bench: { weight: 0, reps: 8 } };
    await expect(saveRankAttempt(user.id, "CHEST", broken, 9999)).rejects.toThrow(
      /UserLiftsLogEntry_positive_check/
    );

    const after = await prisma.muscleRank.findUnique({
      where: { userId_muscle: { userId: user.id, muscle: "CHEST" } },
    });
    expect(after.score).toBe(before.score);
    expect(after.lastRankedAt).toEqual(before.lastRankedAt);
    expect(await historyFor(user)).toHaveLength(1);
  });

  it("rolls back a first-rank insert when the history insert fails", async () => {
    const user = await freshUser();
    const broken = { ...CHEST_LIFTS, bench: { weight: 0, reps: 8 } };

    await expect(saveRankAttempt(user.id, "CHEST", broken, 9999)).rejects.toThrow(
      /UserLiftsLogEntry_positive_check/
    );

    expect(await prisma.muscleRank.count({ where: { userId: user.id } })).toBe(0);
    expect(await historyFor(user)).toHaveLength(0);
  });
});

describe("two concurrent rank requests for the same user", () => {
  const RUNS = 10;
  const results = [];

  afterAll(() => {
    // Raw results, printed so they can be quoted as evidence.
    console.log("concurrency runs (statuses, MuscleRank rows, history rows):");
    for (const r of results) console.log(`  ${r.label}: [${r.statuses}] rank rows ${r.ranks}, history rows ${r.history}`);
  });

  async function race(user) {
    const responses = await Promise.all([postChest(user), postChest(user)]);
    return {
      statuses: responses.map((r) => r.status).sort(),
      ranks: await prisma.muscleRank.count({ where: { userId: user.id, muscle: "CHEST" } }),
      history: await prisma.userLiftsLog.count({ where: { userId: user.id } }),
    };
  }

  it.each(Array.from({ length: RUNS }, (_, i) => i + 1))(
    "fresh account, run %i: exactly one wins, one row, one history entry",
    async (run) => {
      const user = await freshUser();
      const outcome = await race(user);
      results.push({ label: `fresh account run ${run}`, ...outcome });

      expect(outcome).toEqual({ statuses: [200, 403], ranks: 1, history: 1 });
    }
  );

  // The control: a pass above would also happen if the two requests simply ran
  // one after the other. The same harness pointed at a non-atomic
  // check-then-write (the shape of Enhancement 2's cooldown) has to let both
  // through at least once, or the harness is not producing real overlap and
  // the results above prove nothing.
  it("control: the same race defeats a non-atomic check-then-write", async () => {
    async function checkThenWrite(userId) {
      const row = await prisma.muscleRank.findUnique({
        where: { userId_muscle: { userId, muscle: "CHEST" } },
      });
      if (row && Date.now() - row.lastRankedAt.getTime() < RANK_COOLDOWN_HOURS * MS_PER_HOUR) {
        return "locked";
      }
      await prisma.muscleRank.upsert({
        where: { userId_muscle: { userId, muscle: "CHEST" } },
        update: { score: 940, lastRankedAt: new Date() },
        create: { userId, muscle: "CHEST", score: 940 },
      });
      return "saved";
    }

    const outcomes = [];
    for (let run = 1; run <= RUNS; run++) {
      const user = await freshUser();
      const both = await Promise.allSettled([checkThenWrite(user.id), checkThenWrite(user.id)]);
      outcomes.push(both.map((r) => (r.status === "fulfilled" ? r.value : `error ${r.reason?.code}`)).sort());
    }
    const doublePasses = outcomes.filter((o) => o[0] === "saved" && o[1] === "saved").length;
    results.push({
      label: `control (non-atomic), ${RUNS} runs`,
      statuses: `both saved in ${doublePasses}/${RUNS}; outcomes ${JSON.stringify(outcomes)}`,
      ranks: "-",
      history: "-",
    });

    expect(doublePasses).toBeGreaterThan(0);
  });

  it.each([1, 2, 3, 4, 5])(
    "cooled-down account, run %i: exactly one re-rank wins",
    async (run) => {
      const user = await freshUser();
      expect((await postChest(user)).status).toBe(200);
      await expireCooldown(user);

      const outcome = await race(user);
      results.push({ label: `cooled-down account run ${run}`, ...outcome });

      // One history row from the setup rank, one from the winner.
      expect(outcome).toEqual({ statuses: [200, 403], ranks: 1, history: 2 });
    }
  );
});
