// GET /api/exercises, driven through the real app with supertest and a mocked
// Prisma client: no database. What the real query returns from Postgres is
// covered separately by tests-db/exercises.db.test.js.

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    exercise: { findMany: vi.fn() },
  },
}));

const ALLOWED_ORIGIN = "http://localhost:5173";

// Shaped like the query's select: the database returns the nested lists already
// ordered, and the controller must keep that order.
function exerciseRow(slug, { sortOrder, difficulty = "NEWCOMER" } = {}) {
  return {
    slug,
    name: `Name of ${slug}`,
    difficulty,
    videoFile: `${slug}.mp4`,
    sortOrder,
    targets: [{ label: `${slug} target 0` }, { label: `${slug} target 1` }],
    notes: [
      { kind: "CUE", text: `${slug} cue 0` },
      { kind: "CUE", text: `${slug} cue 1` },
      { kind: "MISTAKE", text: `${slug} mistake 0` },
    ],
  };
}

let app;

beforeEach(() => {
  vi.clearAllMocks();
  app = createApp({ clientOrigins: [ALLOWED_ORIGIN] });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/exercises", () => {
  it("returns a muscle's exercises in the shape the client's components read", async () => {
    prisma.exercise.findMany.mockResolvedValue([
      exerciseRow("bench-press", { sortOrder: 0, difficulty: "NEWCOMER" }),
    ]);

    const res = await request(app).get("/api/exercises?muscle=CHEST").expect(200);

    expect(res.body).toEqual([
      {
        id: "bench-press",
        name: "Name of bench-press",
        tier: "newcomer",
        videoFile: "bench-press.mp4",
        muscles: ["bench-press target 0", "bench-press target 1"],
        cues: ["bench-press cue 0", "bench-press cue 1"],
        mistakes: ["bench-press mistake 0"],
      },
    ]);
  });

  it("needs no login: it is public content, like the exercise pages", async () => {
    prisma.exercise.findMany.mockResolvedValue([]);
    await request(app).get("/api/exercises?muscle=CHEST").expect(200);
  });

  it("asks the database for that muscle only, ordered by sortOrder, with nested lists ordered", async () => {
    prisma.exercise.findMany.mockResolvedValue([]);
    await request(app).get("/api/exercises?muscle=LOWER_BACK").expect(200);

    expect(prisma.exercise.findMany).toHaveBeenCalledWith({
      where: { muscle: "LOWER_BACK" },
      orderBy: { sortOrder: "asc" },
      select: {
        slug: true,
        name: true,
        difficulty: true,
        videoFile: true,
        targets: { orderBy: { position: "asc" }, select: { label: true } },
        notes: {
          orderBy: [{ kind: "asc" }, { position: "asc" }],
          select: { kind: true, text: true },
        },
      },
    });
  });

  it("keeps the order the database returned, without re-sorting", async () => {
    // Deliberately not alphabetical, and with tiers out of their nav order.
    prisma.exercise.findMany.mockResolvedValue([
      exerciseRow("zeta", { sortOrder: 0, difficulty: "ELITE" }),
      exerciseRow("alpha", { sortOrder: 1, difficulty: "NEWCOMER" }),
      exerciseRow("mid", { sortOrder: 2, difficulty: "WARRIOR" }),
    ]);

    const res = await request(app).get("/api/exercises?muscle=CHEST").expect(200);

    expect(res.body.map((e) => e.id)).toEqual(["zeta", "alpha", "mid"]);
    expect(res.body.map((e) => e.tier)).toEqual(["elite", "newcomer", "warrior"]);
  });

  it("nests each exercise's own targets, cues and mistakes under it, in order", async () => {
    const mixed = exerciseRow("one", { sortOrder: 0 });
    // Interleaved kinds still split into the right lists, each keeping its order.
    mixed.notes = [
      { kind: "CUE", text: "c0" },
      { kind: "MISTAKE", text: "m0" },
      { kind: "CUE", text: "c1" },
      { kind: "MISTAKE", text: "m1" },
    ];
    prisma.exercise.findMany.mockResolvedValue([mixed, exerciseRow("two", { sortOrder: 1 })]);

    const res = await request(app).get("/api/exercises?muscle=CHEST").expect(200);

    expect(res.body[0].cues).toEqual(["c0", "c1"]);
    expect(res.body[0].mistakes).toEqual(["m0", "m1"]);
    expect(res.body[0].muscles).toEqual(["one target 0", "one target 1"]);
    expect(res.body[1].cues).toEqual(["two cue 0", "two cue 1"]);
    expect(res.body[1].mistakes).toEqual(["two mistake 0"]);
  });

  it("returns an empty list for a real muscle with no exercises", async () => {
    prisma.exercise.findMany.mockResolvedValue([]);

    const res = await request(app).get("/api/exercises?muscle=CALVES").expect(200);

    expect(res.body).toEqual([]);
  });

  it.each([
    ["a missing muscle", "/api/exercises"],
    ["an empty muscle", "/api/exercises?muscle="],
    ["a URL slug instead of the enum", "/api/exercises?muscle=chest"],
    ["a slug that differs from its enum", "/api/exercises?muscle=lowerback"],
    ["an unknown name", "/api/exercises?muscle=NECK"],
    ["a repeated parameter", "/api/exercises?muscle=CHEST&muscle=BACK"],
  ])("answers 400 for %s, without querying", async (_label, url) => {
    const res = await request(app).get(url).expect(400);

    expect(res.body.error).toMatch(/^Query parameter "muscle" must be one of: CHEST, BACK, /);
    expect(res.body.error).toContain("LOWER_BACK");
    expect(prisma.exercise.findMany).not.toHaveBeenCalled();
  });

  it("routes a database failure to the central error handler as JSON", async () => {
    prisma.exercise.findMany.mockRejectedValue(new Error("db down"));

    const res = await request(app).get("/api/exercises?muscle=CHEST").expect(500);

    expect(res.body).toEqual({ error: "db down" });
  });
});
