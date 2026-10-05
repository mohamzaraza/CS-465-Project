// DATABASE check script for the Enhancement 3 migrations. Not part of the test
// suite: it connects to a real database and only runs read-only SELECTs.
//
// Run from server/, and ONLY against the test database:
//   node --env-file=.env.test scripts/db-check-enhancement-3.mjs <phase>
//
// Phases (each check must report 0 for the next step to go ahead):
//   pre-m1   before migration 1: would the email CHECK pass, is UserLiftsLog empty
//   post-m1  after migration 1: did lastRankedAt backfill match lastChestRankAt
//   pre-m2   before migration 2 (the drops): UserLiftsLog still empty
//   post-m2  after migration 2: every dropped column, table and enum is gone
//
// The connection string is never printed; only the database's own name is, so
// the output shows which database answered without leaking credentials.

const REQUIRED_ENV_FILE = ".env.test";

// Prisma Client loads server/.env by itself when it is imported, and keeps any
// value it finds there if DATABASE_URL is not already set. Refusing to start
// unless .env.test was loaded, before Prisma is imported, is what stops a
// missing line in .env.test from silently pointing this at the live database.
const loadedTestEnv = process.execArgv.some(
  (arg) => arg === `--env-file=${REQUIRED_ENV_FILE}` || arg.endsWith(`/${REQUIRED_ENV_FILE}`)
);
if (!loadedTestEnv) {
  console.error(`Refusing to run: start with node --env-file=${REQUIRED_ENV_FILE}`);
  process.exit(2);
}
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(`Refusing to run: ${REQUIRED_ENV_FILE} does not set DATABASE_URL`);
  process.exit(2);
}

const CHECKS = {
  "pre-m1": [
    {
      label: "stored emails that are not lowercase (email CHECK would fail)",
      sql: `SELECT count(*)::int AS n FROM "User" WHERE "email" <> lower("email")`,
    },
    {
      label: "UserLiftsLog rows (adding NOT NULL score needs an empty table)",
      sql: `SELECT count(*)::int AS n FROM "UserLiftsLog"`,
    },
  ],
  "post-m1": [
    {
      label: "chest ranks whose lastRankedAt differs from User.lastChestRankAt",
      sql: `SELECT count(*)::int AS n FROM "MuscleRank" mr JOIN "User" u ON u."id" = mr."userId"
            WHERE mr."muscle" = 'CHEST' AND u."lastChestRankAt" IS NOT NULL
              AND mr."lastRankedAt" IS DISTINCT FROM u."lastChestRankAt"`,
    },
    {
      label: "ranks with no lastRankedAt",
      sql: `SELECT count(*)::int AS n FROM "MuscleRank" WHERE "lastRankedAt" IS NULL`,
    },
  ],
  "pre-m2": [
    {
      label: "UserLiftsLog rows (the old lift columns are dropped next)",
      sql: `SELECT count(*)::int AS n FROM "UserLiftsLog"`,
    },
  ],
  // Read from the catalog rather than inferred from the migration having run, so
  // a partly applied migration shows up as the objects it left behind.
  "post-m2": [
    {
      label: 'column User."lastChestRankAt" still present',
      sql: columnCount("User", ["lastChestRankAt"]),
    },
    {
      label: 'column MuscleRank."tier" still present',
      sql: columnCount("MuscleRank", ["tier"]),
    },
    {
      label: 'columns UserLiftsLog."liftName"/"weight"/"reps" still present',
      sql: columnCount("UserLiftsLog", ["liftName", "weight", "reps"]),
    },
    {
      label: 'table "MuscleMastery" still present',
      sql: `SELECT count(*)::int AS n FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'MuscleMastery'`,
    },
    {
      label: 'enum type "MasteryLevel" still present',
      sql: `SELECT count(*)::int AS n FROM pg_type t JOIN pg_namespace ns ON ns.oid = t.typnamespace
            WHERE ns.nspname = current_schema() AND t.typname = 'MasteryLevel'`,
    },
  ],
};

// The names are fixed literals from this file, never input, so inlining them
// into the SQL is safe.
function columnCount(table, columns) {
  const names = columns.map((name) => `'${name}'`).join(", ");
  return `SELECT count(*)::int AS n FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = '${table}'
            AND column_name IN (${names})`;
}

const phase = process.argv[2];
if (!Object.hasOwn(CHECKS, phase)) {
  console.error(`Usage: node --env-file=${REQUIRED_ENV_FILE} scripts/db-check-enhancement-3.mjs <${Object.keys(CHECKS).join("|")}>`);
  process.exit(2);
}

// Imported only after the guards above, for the reason given there.
const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient({ datasourceUrl: databaseUrl });

let failed = false;
try {
  const [{ db }] = await prisma.$queryRawUnsafe(`SELECT current_database() AS db`);
  console.log(`database: ${db}`);

  // Which migrations are recorded matters as much as the counts: migrate dev
  // would apply any that are missing before it creates a new one.
  const migrationsTable = await prisma.$queryRawUnsafe(
    `SELECT to_regclass('"_prisma_migrations"') IS NOT NULL AS present`
  );
  if (migrationsTable[0].present) {
    const applied = await prisma.$queryRawUnsafe(
      `SELECT migration_name, finished_at IS NOT NULL AS finished
         FROM "_prisma_migrations" ORDER BY migration_name`
    );
    console.log(`recorded migrations: ${applied.length}`);
    for (const row of applied) {
      console.log(`  ${row.finished ? "applied " : "UNFINISHED"} ${row.migration_name}`);
    }
  } else {
    console.log("recorded migrations: none (_prisma_migrations does not exist)");
  }

  for (const check of CHECKS[phase]) {
    try {
      const [{ n }] = await prisma.$queryRawUnsafe(check.sql);
      console.log(`${n === 0 ? "ok  " : "FAIL"} ${n}  ${check.label}`);
      if (n !== 0) failed = true;
    } catch (err) {
      // A missing table is reported, not hidden: it means the schema is not
      // where this phase expects it to be.
      console.log(`FAIL -  ${check.label}: ${err.meta?.message ?? err.message}`);
      failed = true;
    }
  }
} finally {
  await prisma.$disconnect();
}

process.exit(failed ? 1 : 0);
