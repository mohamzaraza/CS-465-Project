// The leaderboard endpoints, driven through the real app with supertest and a
// mocked Prisma client: no database, no network.
//
// The chest response must keep exactly the fields the client reads today
// (email included, until Enhancement 3), with only the rank numbers changing
// for tied scores. The total endpoint must use the same row shape.

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
const ROW_FIELDS = ["rank", "score", "tier", "user"];

let app;

beforeEach(() => {
  vi.clearAllMocks();
  app = createApp({ clientOrigins: [ALLOWED_ORIGIN] });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Shaped like the chest query's result: MuscleRank columns plus user.email.
function chestRow(userId, score, tier = "HEROIC") {
  return {
    id: `rank-${userId}`,
    muscle: "CHEST",
    tier,
    score,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    userId,
    user: { email: `${userId}@example.com` },
  };
}

// Shaped like the total query's select: only userId, score and user.email.
function totalRow(userId, score) {
  return { userId, score, user: { email: `${userId}@example.com` } };
}

describe("GET /api/leaderboard/chest", () => {
  it("keeps the query, adding only the userId tie-break", async () => {
    prisma.muscleRank.findMany.mockResolvedValue([]);
    await request(app).get("/api/leaderboard/chest").expect(200);

    expect(prisma.muscleRank.findMany).toHaveBeenCalledWith({
      where: { muscle: "CHEST" },
      orderBy: [{ score: "desc" }, { userId: "asc" }],
      take: 20,
      include: { user: { select: { email: true } } },
    });
    expect(LEADERBOARD_LIMIT).toBe(20);
  });

  it("returns the same fields as before, email included", async () => {
    prisma.muscleRank.findMany.mockResolvedValue([chestRow("u1", 900, "TITAN")]);
    const res = await request(app).get("/api/leaderboard/chest").expect(200);

    expect(res.body).toEqual([{ rank: 1, user: "u1@example.com", tier: "TITAN", score: 900 }]);
  });

  it("gives distinct scores the same ranks index + 1 did", async () => {
    prisma.muscleRank.findMany.mockResolvedValue([
      chestRow("u1", 900),
      chestRow("u2", 800),
      chestRow("u3", 700),
    ]);
    const res = await request(app).get("/api/leaderboard/chest").expect(200);

    expect(res.body.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("gives tied scores the same rank and skips the next", async () => {
    prisma.muscleRank.findMany.mockResolvedValue([
      chestRow("u1", 900),
      chestRow("u2", 800),
      chestRow("u3", 800),
      chestRow("u4", 700),
    ]);
    const res = await request(app).get("/api/leaderboard/chest").expect(200);

    expect(res.body.map((r) => [r.user, r.rank])).toEqual([
      ["u1@example.com", 1],
      ["u2@example.com", 2],
      ["u3@example.com", 2],
      ["u4@example.com", 4],
    ]);
  });

  it("still answers 500 with the same message when the query fails", async () => {
    prisma.muscleRank.findMany.mockRejectedValue(new Error("db down"));
    const res = await request(app).get("/api/leaderboard/chest").expect(500);

    expect(res.body).toEqual({ error: "Failed to load leaderboard" });
  });
});

describe("GET /api/leaderboard/total", () => {
  it("reads only the columns it needs in one query", async () => {
    prisma.muscleRank.findMany.mockResolvedValue([]);
    const res = await request(app).get("/api/leaderboard/total").expect(200);

    expect(res.body).toEqual([]);
    expect(prisma.muscleRank.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.muscleRank.findMany).toHaveBeenCalledWith({
      select: { userId: true, score: true, user: { select: { email: true } } },
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
      { rank: 1, user: "a@example.com", tier: null, score: 950 },
      { rank: 2, user: "b@example.com", tier: null, score: 900 },
      { rank: 3, user: "c@example.com", tier: null, score: 300 },
    ]);
  });

  it("ties share a rank and are ordered by userId, like the chest query", async () => {
    prisma.muscleRank.findMany.mockResolvedValue([
      totalRow("z", 400),
      totalRow("m", 250),
      totalRow("m", 150),
      totalRow("b", 400),
      totalRow("q", 100),
    ]);
    const res = await request(app).get("/api/leaderboard/total").expect(200);

    expect(res.body.map((r) => [r.user, r.rank, r.score])).toEqual([
      ["b@example.com", 1, 400],
      ["m@example.com", 1, 400],
      ["z@example.com", 1, 400],
      ["q@example.com", 4, 100],
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
    expect(res.body[0].user).toBe("user29@example.com");
  });

  it("answers 500 with the chest endpoint's message when the query fails", async () => {
    prisma.muscleRank.findMany.mockRejectedValue(new Error("db down"));
    const res = await request(app).get("/api/leaderboard/total").expect(500);

    expect(res.body).toEqual({ error: "Failed to load leaderboard" });
  });
});

describe("both leaderboards", () => {
  it("return rows with exactly the same fields, email included", async () => {
    prisma.muscleRank.findMany.mockResolvedValueOnce([chestRow("u1", 900)]);
    const chest = await request(app).get("/api/leaderboard/chest").expect(200);
    prisma.muscleRank.findMany.mockResolvedValueOnce([totalRow("u1", 900)]);
    const total = await request(app).get("/api/leaderboard/total").expect(200);

    expect(Object.keys(chest.body[0]).sort()).toEqual(ROW_FIELDS);
    expect(Object.keys(total.body[0]).sort()).toEqual(ROW_FIELDS);
    expect(chest.body[0].user).toBe("u1@example.com");
    expect(total.body[0].user).toBe("u1@example.com");
  });
});
