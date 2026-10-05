// GET /api/exercises against the real test database: the query, its ordering and
// the nesting are checked as Postgres actually executes them, not as a mock
// imitates them (tests/exerciseController.test.js covers the mocked side).
//
// The fixture rows are test data, not catalog content: every slug starts with
// "dbtest-", they go under a muscle with no real exercises, and they are deleted
// before and after the run so the site never shows them.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";

import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";

const SLUG_PREFIX = "dbtest-";
const MUSCLE = "FOREARMS";

const app = createApp({ clientOrigins: [] });

function removeFixtures() {
  // Targets and notes go with their exercise (ON DELETE CASCADE).
  return prisma.exercise.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });
}

// Inserted out of order on purpose, at every level, so a correct response
// proves the query sorts rather than the rows happening to come back in order.
async function insertFixtures() {
  const rows = [
    { slug: "dbtest-third", difficulty: "ELITE", sortOrder: 2 },
    { slug: "dbtest-first", difficulty: "NEWCOMER", sortOrder: 0 },
    { slug: "dbtest-second", difficulty: "WARRIOR", sortOrder: 1 },
  ];
  for (const row of rows) {
    await prisma.exercise.create({
      data: {
        ...row,
        muscle: MUSCLE,
        name: `${row.slug} name`,
        videoFile: `${row.slug}.mp4`,
        targets: {
          create: [
            { position: 1, label: `${row.slug} target 1` },
            { position: 0, label: `${row.slug} target 0` },
          ],
        },
        notes: {
          create: [
            { kind: "MISTAKE", position: 1, text: `${row.slug} mistake 1` },
            { kind: "CUE", position: 1, text: `${row.slug} cue 1` },
            { kind: "MISTAKE", position: 0, text: `${row.slug} mistake 0` },
            { kind: "CUE", position: 0, text: `${row.slug} cue 0` },
          ],
        },
      },
    });
  }
}

function expected(slug, tier) {
  return {
    id: slug,
    name: `${slug} name`,
    tier,
    videoFile: `${slug}.mp4`,
    muscles: [`${slug} target 0`, `${slug} target 1`],
    cues: [`${slug} cue 0`, `${slug} cue 1`],
    mistakes: [`${slug} mistake 0`, `${slug} mistake 1`],
  };
}

beforeAll(async () => {
  await removeFixtures();
  // Refuse rather than mix fixtures into real content for this muscle.
  const realRows = await prisma.exercise.count({ where: { muscle: MUSCLE } });
  if (realRows > 0) {
    throw new Error(`${MUSCLE} has real exercises now; pick another fixture muscle`);
  }
  await insertFixtures();
});

afterAll(async () => {
  await removeFixtures();
  await prisma.$disconnect();
});

describe("GET /api/exercises against the test database", () => {
  it("returns the muscle's exercises sorted by sortOrder, each with its own lists sorted", async () => {
    const res = await request(app).get(`/api/exercises?muscle=${MUSCLE}`).expect(200);

    expect(res.body).toEqual([
      expected("dbtest-first", "newcomer"),
      expected("dbtest-second", "warrior"),
      expected("dbtest-third", "elite"),
    ]);
  });

  it("returns only that muscle's exercises", async () => {
    const res = await request(app).get("/api/exercises?muscle=CALVES").expect(200);

    expect(res.body.some((e) => e.id.startsWith(SLUG_PREFIX))).toBe(false);
  });

  it("answers 400 for a value outside the database's MuscleGroup enum", async () => {
    await request(app).get("/api/exercises?muscle=forearm").expect(400);
  });

  it("enforces the catalog's constraints in the database itself", async () => {
    // Two exercises at the same position for one muscle would make the page
    // order ambiguous; the unique (muscle, sortOrder) index refuses it.
    await expect(
      prisma.exercise.create({
        data: {
          slug: "dbtest-duplicate-order",
          muscle: MUSCLE,
          name: "dbtest-duplicate-order name",
          difficulty: "NEWCOMER",
          videoFile: "dbtest-duplicate-order.mp4",
          sortOrder: 0,
        },
      })
    ).rejects.toMatchObject({ code: "P2002" });
  });
});
