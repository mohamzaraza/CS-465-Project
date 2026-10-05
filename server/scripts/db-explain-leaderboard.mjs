// DATABASE script: measures whether MuscleRank_muscle_score_userId_idx helps the
// chest leaderboard query. Test database ONLY:
//   node --env-file=.env.test scripts/db-explain-leaderboard.mjs [users]
//
// 1. Seeds synthetic users (emails "e3-explain-N@example.invalid") with a rank
//    on four muscles each, then VACUUM ANALYZE so the planner has real stats.
// 2. Captures the exact SQL Prisma sends for the leaderboard query.
// 3. EXPLAIN (ANALYZE, BUFFERS) on it with the index, then again with the index
//    dropped INSIDE a transaction that is always rolled back, so the database
//    cannot be left without the index whatever happens.
// 4. Confirms the index exists and deletes every synthetic row.

import { randomUUID } from "node:crypto";

const REQUIRED_ENV_FILE = ".env.test";
if (!process.execArgv.includes(`--env-file=${REQUIRED_ENV_FILE}`) || !process.env.DATABASE_URL) {
  console.error(`Refusing to run: start with node --env-file=${REQUIRED_ENV_FILE}`);
  process.exit(2);
}

const USERS = Number(process.argv[2] ?? 3000);
const MUSCLES = ["CHEST", "BACK", "SHOULDERS", "QUADS"];
const EMAIL_PREFIX = "e3-explain-";
const INDEX = "MuscleRank_muscle_score_userId_idx";
const RUNS = 21;

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: [{ emit: "event", level: "query" }],
});

let captured = null;
prisma.$on("query", (event) => {
  if (captured === "armed") captured = { sql: event.query, params: JSON.parse(event.params) };
});

// mulberry32: deterministic scores, so a rerun measures the same data.
function rng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function removeSynthetic() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: EMAIL_PREFIX } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  const ranks = await prisma.muscleRank.deleteMany({ where: { userId: { in: ids } } });
  const deleted = await prisma.user.deleteMany({ where: { id: { in: ids } } });
  return { users: deleted.count, ranks: ranks.count };
}

async function indexExists() {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT count(*)::int AS n FROM pg_indexes WHERE schemaname = current_schema() AND indexname = $1`,
    INDEX
  );
  return rows[0].n === 1;
}

function planText(rows) {
  return rows.map((row) => row["QUERY PLAN"]).join("\n");
}

function executionMs(text) {
  return Number(/Execution Time: ([\d.]+) ms/.exec(text)[1]);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[(sorted.length - 1) >> 1];
}

async function measure(client, label) {
  const explain = `EXPLAIN (ANALYZE, BUFFERS) ${captured.sql}`;
  const times = [];
  let lastPlan = "";
  for (let i = 0; i < RUNS; i++) {
    lastPlan = planText(await client.$queryRawUnsafe(explain, ...captured.params));
    times.push(executionMs(lastPlan));
  }
  console.log(`\n=== ${label}: plan of the last of ${RUNS} runs (cache warm) ===`);
  console.log(lastPlan);
  console.log(`execution time over ${RUNS} runs: median ${median(times)} ms, min ${Math.min(...times)} ms, max ${Math.max(...times)} ms`);
}

// Thrown to roll the index-less transaction back on purpose.
class Rollback extends Error {}

try {
  const [{ db }] = await prisma.$queryRawUnsafe(`SELECT current_database() AS db`);
  console.log(`database: ${db}`);
  if (!(await indexExists())) throw new Error(`${INDEX} is missing before the run; not touching anything`);

  const leftovers = await removeSynthetic();
  if (leftovers.users > 0) console.log(`removed leftovers from an earlier run: ${JSON.stringify(leftovers)}`);

  const random = rng(465);
  const users = Array.from({ length: USERS }, (_, i) => ({
    id: randomUUID(),
    email: `${EMAIL_PREFIX}${i}@example.invalid`,
    password: "not-a-real-hash",
  }));
  await prisma.user.createMany({ data: users });
  const ranks = users.flatMap((user) =>
    MUSCLES.map((muscle) => ({ userId: user.id, muscle, score: 300 + Math.floor(random() * 2300) }))
  );
  await prisma.muscleRank.createMany({ data: ranks });
  await prisma.$executeRawUnsafe(`VACUUM ANALYZE "User"`);
  await prisma.$executeRawUnsafe(`VACUUM ANALYZE "MuscleRank"`);

  const counts = await prisma.$queryRawUnsafe(
    `SELECT count(*)::int AS total, count(*) FILTER (WHERE "muscle" = 'CHEST')::int AS chest FROM "MuscleRank"`
  );
  console.log(`seeded ${USERS} synthetic users; MuscleRank now holds ${counts[0].total} rows, ${counts[0].chest} of them CHEST`);

  // The same arguments leaderboardController.getChestLeaderboard passes
  // (pinned by tests/leaderboardController.test.js); the SQL is whatever
  // Prisma generates for them.
  captured = "armed";
  await prisma.muscleRank.findMany({
    where: { muscle: "CHEST" },
    orderBy: [{ score: "desc" }, { userId: "asc" }],
    take: 20,
    select: { score: true },
  });
  console.log(`\nSQL Prisma sends for the chest leaderboard:\n${captured.sql}\nparams: ${JSON.stringify(captured.params)}`);

  await measure(prisma, "WITH the index");

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`DROP INDEX "${INDEX}"`);
        await measure(tx, "WITHOUT the index (dropped inside a transaction that is rolled back)");
        throw new Rollback();
      },
      { timeout: 120_000 }
    );
  } catch (err) {
    if (!(err instanceof Rollback)) throw err;
  }

  console.log(`\nindex present after the run: ${await indexExists()}`);
} finally {
  if (captured !== null) captured = null;
  const removed = await removeSynthetic();
  console.log(`cleanup: deleted ${removed.ranks} synthetic MuscleRank rows and ${removed.users} synthetic users`);
  console.log(`index present at exit: ${await indexExists()}`);
  await prisma.$disconnect();
}
