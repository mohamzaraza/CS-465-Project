// The leaderboard endpoints, driven through the real app with supertest and a
// mocked Prisma client: no database, no network.
//
// Leaderboards are public, so since Enhancement 3 neither endpoint sends
// anything that identifies a user: the email that used to go out as `user` is
// gone, and the queries no longer read it at all. The chest tier is derived from
// the score. Both endpoints still share one row shape.

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { LEADERBOARD_LIMIT } from "../controllers/leaderboardController.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    muscleRank: { findMany: vi.fn() },
  },
}));

const ALLOWED_ORIGIN = "http://localhost:5173";
const ROW_FIELDS = ["rank", "score", "tier"];

// Chest thresholds from the ranking engine: Titan starts at 1390, Heroic at 940.
const TITAN_SCORE = 1390;
const HEROIC_SCORE = 940;

let app;

beforeEach(() => {
  vi.clearAllMocks();
  app = createApp({ clientOrigins: [ALLOWED_ORIGIN] });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Shaped like the chest query's result: it selects only the score.
function chestRow(score) {
  return { score };
}

// Shaped like the total query's select: only userId and score.
function totalRow(userId, score) {
  return { userId, score };
}

describe("GET /api/leaderboard/chest", () => {
  it("filters and orders by exactly the leaderboard index's columns, reading only the score", async () => {
    prisma.muscleRank.findMany.mockResolvedValue([]);
    await request(app).get("/api/leaderboard/chest").expect(200);

    // muscle, score desc, userId: MuscleRank_muscle_score_userId_idx.
    expect(prisma.muscleRank.findMany).toHaveBeenCalledWith({
      where: { muscle: "CHEST" },
      orderBy: [{ score: "desc" }, { userId: "asc" }],
      take: 20,
      select: { score: true },
    });
    expect(LEADERBOARD_LIMIT).toBe(20);
  });

  it("returns rank, tier and score, with the tier derived from the score", async () => {
    prisma.muscleRank.findMany.mockResolvedValue([chestRow(TITAN_SCORE)]);
    const res = await request(app).get("/api/leaderboard/chest").expect(200);

    expect(res.body).toEqual([{ rank: 1, tier: "TITAN", score: TITAN_SCORE }]);
  });

  it("derives each row's tier on its own, at the tier boundary", async () => {
    prisma.muscleRank.findMany.mockResolvedValue([
      chestRow(TITAN_SCORE),
      chestRow(TITAN_SCORE - 1),
      chestRow(HEROIC_SCORE),
    ]);
    const res = await request(app).get("/api/leaderboard/chest").expect(200);

    expect(res.body.map((r) => r.tier)).toEqual(["TITAN", "CHAMPION", "HEROIC"]);
  });

  it("gives distinct scores the same ranks index + 1 did", async () => {
    prisma.muscleRank.findMany.mockResolvedValue([chestRow(900), chestRow(800), chestRow(700)]);
    const res = await request(app).get("/api/leaderboard/chest").expect(200);

    expect(res.body.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("gives tied scores the same rank and skips the next", async () => {
    prisma.muscleRank.findMany.mockResolvedValue([
      chestRow(900),
      chestRow(800),
      chestRow(800),
      chestRow(700),
    ]);
    const res = await request(app).get("/api/leaderboard/chest").expect(200);

    expect(res.body.map((r) => [r.score, r.rank])).toEqual([
      [900, 1],
      [800, 2],
      [800, 2],
      [700, 4],
    ]);
  });

  it("still answers 500 with the same message when the query fails", async () => {
    prisma.muscleRank.findMany.mockRejectedValue(new Error("db down"));
    const res = await request(app).get("/api/leaderboard/chest").expect(500);

    expect(res.body).toEqual({ error: "Failed to load leaderboard" });
  });
});

describe("GET /api/leaderboard/total", () => {
  it("reads only the columns it needs in one query, and nothing about the user", async () => {
    prisma.muscleRank.findMany.mockResolvedValue([]);
    const res = await request(app).get("/api/leaderboard/total").expect(200);

    expect(res.body).toEqual([]);
    expect(prisma.muscleRank.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.muscleRank.findMany).toHaveBeenCalledWith({
      select: { userId: true, score: true },
    });
  });

  it("sums each user's muscles, including users who ranked only some", async () => {
    prisma.muscleRank.findMany.mockResolvedValue([
      totalRow("a", 500), // a: chest
      totalRow("b", 900), // b: chest only
      totalRow("a", 300), // a: back
      totalRow("c", 200),
      totalRow("a", 150), // a: shoulders
      totalRow("c", 100),
    ]);
    const res = await request(app).get("/api/leaderboard/total").expect(200);

    expect(res.body).toEqual([
      { rank: 1, tier: null, score: 950 },
      { rank: 2, tier: null, score: 900 },
      { rank: 3, tier: null, score: 300 },
    ]);
  });

  it("ties share a rank and the next rank is skipped, like the chest query", async () => {
    prisma.muscleRank.findMany.mockResolvedValue([
      totalRow("z", 400),
      totalRow("m", 250),
      totalRow("m", 150),
      totalRow("b", 400),
      totalRow("q", 100),
    ]);
    const res = await request(app).get("/api/leaderboard/total").expect(200);

    expect(res.body.map((r) => [r.rank, r.score])).toEqual([
      [1, 400],
      [1, 400],
      [1, 400],
      [4, 100],
    ]);
  });

  it("returns at most 20 users, the highest totals, best first", async () => {
    // 30 users with two rows each; user i totals 10 * i.
    const rows = [];
    for (let i = 0; i < 30; i++) {
      const id = `user${String(i).padStart(2, "0")}`;
      rows.push(totalRow(id, 4 * i), totalRow(id, 6 * i));
    }
    prisma.muscleRank.findMany.mockResolvedValue(rows);
    const res = await request(app).get("/api/leaderboard/total").expect(200);

    expect(res.body).toHaveLength(LEADERBOARD_LIMIT);
    expect(res.body.map((r) => r.score)).toEqual(
      Array.from({ length: 20 }, (_, j) => 10 * (29 - j))
    );
    expect(res.body.map((r) => r.rank)).toEqual(Array.from({ length: 20 }, (_, j) => j + 1));
  });

  it("answers 500 with the chest endpoint's message when the query fails", async () => {
    prisma.muscleRank.findMany.mockRejectedValue(new Error("db down"));
    const res = await request(app).get("/api/leaderboard/total").expect(500);

    expect(res.body).toEqual({ error: "Failed to load leaderboard" });
  });
});

describe("both leaderboards", () => {
  it("return rows with exactly the same fields, and nothing identifying a user", async () => {
    prisma.muscleRank.findMany.mockResolvedValueOnce([chestRow(TITAN_SCORE)]);
    const chest = await request(app).get("/api/leaderboard/chest").expect(200);
    // An email-shaped userId, so a leak of the id would show up below too.
    prisma.muscleRank.findMany.mockResolvedValueOnce([totalRow("u1@example.com", 900)]);
    const total = await request(app).get("/api/leaderboard/total").expect(200);

    expect(Object.keys(chest.body[0]).sort()).toEqual(ROW_FIELDS);
    expect(Object.keys(total.body[0]).sort()).toEqual(ROW_FIELDS);
    expect(chest.body[0]).not.toHaveProperty("user");
    expect(total.body[0]).not.toHaveProperty("user");
    expect(total.text).not.toContain("u1@example.com");
    expect(total.text).not.toContain("@");
  });
});
