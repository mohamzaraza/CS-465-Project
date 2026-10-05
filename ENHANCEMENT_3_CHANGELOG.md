# Enhancement 3 Change Log: Databases

## Summary

Measured at the end of branch `enhancement-3` against the tag
`baseline-before-enhancement-3`. Every database step ran against the **test
database** only (`server/.env.test`, a separate Neon project). The live
database has not been touched: the checklist at the end of this file is what
has to happen before it is.

### Problems from the code review (databases category)

| # | Problem | What changed | Files | How it was verified |
|---|---|---|---|---|
| 1 | `MuscleMastery` (and its `MasteryLevel` enum) existed in the schema, but nothing in `server/` or `client/` used it. | Table and enum dropped. | `prisma/schema.prisma`, Migration 2 | `db-check-enhancement-3.mjs post-m2` reads the catalog and reports both gone (0 rows each); a repo-wide grep finds no reference. |
| 2 | `UserLiftsLog` was defined but never written, with one row per lift and no link between the lifts of one attempt. | Repurposed as append-only rank history: one `UserLiftsLog` row per saved attempt (`score`, `weightUnit`, `timestamp`) with one `UserLiftsLogEntry` per lift (`liftKey`, `weight`, `reps`, `CHECK weight > 0 AND reps > 0`). Written in the **same transaction** as the rank save, for chest and back. The tier is deliberately not stored (decision D3). | `schema.prisma`, both migrations, `controllers/rankingController.js` | Mocked: exactly one history row with 3 entries per saved rank on the update and the insert path, none on a 403 or a 400. Real database (`tests-db/ranking.db.test.js`): history appears after a first rank and after a re-rank, none while locked; a forced failure in the history insert rolls back both an update and a first-rank insert. |
| 3 | `MuscleRank.tier` duplicated what `score` already determines. | Column dropped. The zero-score rule moved into one `classify()` inside the engine, shared by `rank()` and a new `tierOf()`; `tierForScore(muscle, score)` in `src/ranking/index.js` derives the uppercase tier for every response (decision D1). | `src/ranking/rankingEngine.js`, `src/ranking/index.js`, both controllers, Migration 2 | `tests/ranking.tierForScore.test.js`: 753 cases, every fixture input that passes validation, `tierForScore(m, rank(l).score) === rank(l).tier.toUpperCase()`. Golden master: all 791 entries reproduced unchanged. |
| 4 | The chest leaderboard query had no index beyond the `(userId, muscle)` unique constraint, which cannot serve it. | `MuscleRank_muscle_score_userId_idx` on `(muscle, score DESC, userId)`, exactly the query's filter, order and tie-break. The query now selects only `score`. | `schema.prisma`, Migration 1, `controllers/leaderboardController.js` | `scripts/db-explain-leaderboard.mjs`, results below: Index Scan, 21 buffers, 0.08 ms median, versus Seq Scan + top-N heapsort over the whole table, 197 buffers, 2.41 ms. |
| 5 | Both leaderboards sent each user's email as `user`. | Field removed (not renamed) from both endpoints, and the queries no longer read anything about the user. Client: the user column and its header are gone, the grid is four columns, and tied rows are keyed by position. No schema change was needed (decision D5: no display name). | `controllers/leaderboardController.js`, `client/src/components/colosseum/*` | Server: rows have exactly `rank`, `tier`, `score`, and the response text contains no `@`. Client: a stray `user` field is never rendered; two identical tied rows raise no duplicate-key warning (this test fails against the old component). |
| 6 | The cooldown was `User.lastChestRankAt`, so only chest had one, and the check and the write were two separate steps. | `MuscleRank.lastRankedAt` per muscle (backfilled from the old column, which was then dropped). The check **is** the write: a conditional `UPDATE … WHERE lastRankedAt <= now − 12h`, then `INSERT … ON CONFLICT DO NOTHING` for a first rank, in one transaction. Back now saves with its own cooldown. | `schema.prisma`, both migrations, `controllers/rankingController.js` | 15 of 15 concurrent pairs on the real database produced exactly one 200 and one 403, one `MuscleRank` row, and one history row per win, while the same harness defeated a non-atomic version 10 of 10 times (results below). |
| 7 | Email lookup was exact-match, so `A@x.com` and `a@x.com` could both register. | Register and login lowercase the address. In the database, `CHECK (email = lower(email))` makes the existing unique index case-insensitive. | `controllers/authController.js`, Migration 1 (hand-written: Prisma cannot express CHECK) | Tests: a mixed-case sign-up is stored lowercase, re-registering in another case answers 409, and login looks up the lowercase form. `db-check final` confirms the constraint exists. **Existing data:** see the live-database checklist. |
| 8 | The exercise catalog was hard-coded in `client/src/data/exercises.js`. | `Exercise`, `ExerciseTarget` and `ExerciseNote` tables (cues and mistakes normalized, not JSON); `prisma/seed.js` upserts the catalog on slug; public `GET /api/exercises?muscle=ENUM`, validated against the real `MuscleGroup` enum; `MusclePage` fetches it with loading, error + Retry and the existing coming-soon state. Each muscle in `muscleGroups.js` carries its enum value (decision D8). The static file is deleted. | `prisma/seed.js`, `prisma/seedData/exercises.js`, `controllers/exerciseController.js`, `routes/exerciseRoutes.js`, `client/src/pages/workouts/MusclePage.jsx`, `client/src/data/muscleGroups.js` | Mocked route tests (shape, order, nesting, empty muscle, six invalid inputs). Real database (`tests-db/exercises.db.test.js`): fixtures inserted out of order at every level come back sorted. The seed copy was held identical to the client file by a parity test until the file was deleted. The seed inserted 3 exercises, 9 targets and 21 notes (12 cues, 9 mistakes), and a second run gave the same counts. Checked by hand in the browser at `/workouts/upper/chest`. |

### Evidence: two concurrent rank requests (real test database)

`tests-db/ranking.db.test.js` fires two requests with `Promise.all` through the
real app. Each request gets its own connection from Prisma's pool, so they
overlap at the database. Raw output:

```
concurrency runs (statuses, MuscleRank rows, history rows):
  fresh account run 1: [200,403] rank rows 1, history rows 1
  fresh account run 2: [200,403] rank rows 1, history rows 1
  fresh account run 3: [200,403] rank rows 1, history rows 1
  fresh account run 4: [200,403] rank rows 1, history rows 1
  fresh account run 5: [200,403] rank rows 1, history rows 1
  fresh account run 6: [200,403] rank rows 1, history rows 1
  fresh account run 7: [200,403] rank rows 1, history rows 1
  fresh account run 8: [200,403] rank rows 1, history rows 1
  fresh account run 9: [200,403] rank rows 1, history rows 1
  fresh account run 10: [200,403] rank rows 1, history rows 1
  control (non-atomic), 10 runs: [both saved in 10/10; outcomes [["saved","saved"], ... x10]] rank rows -, history rows -
  cooled-down account run 1: [200,403] rank rows 1, history rows 2
  cooled-down account run 2: [200,403] rank rows 1, history rows 2
  cooled-down account run 3: [200,403] rank rows 1, history rows 2
  cooled-down account run 4: [200,403] rank rows 1, history rows 2
  cooled-down account run 5: [200,403] rank rows 1, history rows 2
```

The control matters. A pass would also happen if the two requests just ran
one after the other. The same harness pointed at a read-then-write cooldown
(the shape of Enhancement 2's) let **both** requests through in 10 of 10
runs, so the overlap is real, and the conditional update is what stops it.
"Cooled-down" runs start from an account whose cooldown was moved 13 hours
into the past, so both requests race on the update path; history shows 2
because the setup rank is logged too.

Pinned alongside, on the real database: inside a transaction,
`createMany({ skipDuplicates: true })` reports a conflict as `count: 0` and
the transaction carries on. The previous create-and-catch-P2002 leaves the
transaction failing with "current transaction is aborted" on the next
statement. That is why the save could not simply be wrapped in a transaction
as it was.

**Neon pooler.** Interactive transactions, including these concurrent ones,
worked through Neon's pooled connection on every run: four full runs of
`npm run test:db`, all green (24 tests in the first two, 25 once the control
was added). This was a risk flagged before the work, and it did not
materialize for this pattern.

### Evidence: the leaderboard index (real test database)

`scripts/db-explain-leaderboard.mjs`: 3,000 synthetic users × 4 muscles =
12,000 `MuscleRank` rows (3,000 of them CHEST), then `VACUUM ANALYZE`, then 21
runs of `EXPLAIN (ANALYZE, BUFFERS)` on the exact SQL Prisma sends:

```
SELECT "public"."MuscleRank"."id", "public"."MuscleRank"."score" FROM "public"."MuscleRank"
WHERE "public"."MuscleRank"."muscle" = CAST($1::text AS "public"."MuscleGroup")
ORDER BY "public"."MuscleRank"."score" DESC, "public"."MuscleRank"."userId" ASC LIMIT $2 OFFSET $3
params: ["CHEST",20,0]
```

With the index (plan excerpt; `Index Searches` and `Planning Time` lines omitted):

```
Limit  (cost=0.29..6.60 rows=20 width=78) (actual time=0.026..0.063 rows=20.00 loops=1)
  Buffers: shared hit=21
  ->  Index Scan using "MuscleRank_muscle_score_userId_idx" on "MuscleRank"  (cost=0.29..946.89 rows=3000 width=78) (actual time=0.025..0.060 rows=20.00 loops=1)
        Index Cond: (muscle = ('CHEST'::cstring)::"MuscleGroup")
        Buffers: shared hit=21
Execution Time: 0.091 ms
execution time over 21 runs: median 0.08 ms, min 0.077 ms, max 0.116 ms
```

Without it (dropped inside a transaction that is always rolled back, so the
database can never be left without the index; plan excerpt, `Planning Time`
omitted):

```
Limit  (cost=486.83..486.88 rows=20 width=78) (actual time=4.280..4.284 rows=20.00 loops=1)
  Buffers: shared hit=197
  ->  Sort  (cost=486.83..494.33 rows=3000 width=78) (actual time=4.279..4.280 rows=20.00 loops=1)
        Sort Key: score DESC, "userId"
        Sort Method: top-N heapsort  Memory: 29kB
        ->  Seq Scan on "MuscleRank"  (cost=0.00..407.00 rows=3000 width=78) (actual time=0.014..3.855 rows=3000.00 loops=1)
              Filter: (muscle = ('CHEST'::cstring)::"MuscleGroup")
              Rows Removed by Filter: 9000
              Buffers: shared hit=197
Execution Time: 4.317 ms
execution time over 21 runs: median 2.413 ms, min 2.349 ms, max 4.317 ms
```

Honest reading: about 2.3 ms saved per request at this size, against a network
round trip to Neon of tens of milliseconds, so nobody would notice it today.
The plan shape is the evidence. With the index, the work is the top 20 rows
however large the table grows (21 buffers). Without it, every row of every
muscle is read and sorted (197 buffers here), and that grows linearly.
Prisma adds `id` to the select even though the controller asks only for
`score`, which is why this is an Index Scan with 20 heap fetches rather than an
index-only scan.

### Trade-offs and decisions, stated plainly

- **Two migrations, additive then destructive.** Nothing was dropped before
  its replacement was verified: the backfill was checked (`post-m1`), the
  `tierForScore` cross-check passed, and `UserLiftsLog` was confirmed empty
  (`pre-m2`) before Migration 2 was generated.
- **Both migrations were generated offline** (`prisma migrate diff` between
  schema files) and applied with `migrate deploy`. `migrate dev` would have
  applied the baseline migrations and created a shadow database on the test
  server just to produce a file. Hand edits are marked `HAND EDIT` in the SQL:
  the `lastRankedAt` backfill (Prisma's one-liner would have stamped every row
  with "now" and locked every user out for 12 hours) and the two CHECK
  constraints.
- **The seed owns its data.** `client/src/data/exercises.js` builds URLs from
  Vite's `import.meta.env` when it loads, which plain Node cannot evaluate, so
  the seed reads a verbatim copy in `prisma/seedData/exercises.js`. A parity
  test compared the two until the client file was deleted (approved change).
- **Back's response changed shape.** It used to return the unsaved engine
  result (`{ muscle: "back", tier: "Heroic", score }`); it now saves and
  returns the same saved-row shape as chest, with an uppercase tier. No client
  code calls it.
- **Database tests are separate from `npm test`.** `tests-db/` runs only via
  `npm run test:db`, whose config refuses to start without
  `--env-file=.env.test`. The same guard is on the seed and both database
  scripts, because Prisma Client otherwise loads `server/.env` by itself.

### Left undone, and why

- **Nothing reads the history yet.** It is written on every saved rank, but no
  endpoint or page shows it. That is a feature, not a database fix.
- **No public display name** (decision D5). With email removed, leaderboard
  rows identify nobody. A `User.displayName` column is the natural next step if
  a leaderboard should show who is who.
- **Only chest and back can be ranked.** The other muscles have no ranking
  engine configured, so the per-muscle cooldown has nothing else to serve yet.
- **The total leaderboard still reads every rank row** and sums in memory.
  Enhancement 2 did that partly because a `groupBy` lost the email; that reason
  is gone, so a database-side aggregate is now possible. It was not in scope.
- **Every weight is recorded as `LB`.** The ranking form has no unit field and
  the engine's anchors are in pounds; the column exists for when it does.
- **Dead-code candidates found in the final review, reported and not removed:**
  - `StrengthTier` is no longer used by any column. It was kept on purpose,
    because the client's tier styles test mirrors it as the list of tier names.
  - `GET /api/exercises` returns `muscles` (targets), which no component renders.
  - The chest POST response still sends `id`, `userId` and `updatedAt`; the
    client reads only `tier` and `score`. Kept as the existing contract.
  - `tests/app.test.js` still mocks `muscleRank.upsert`, which nothing calls.
  - `db-check-enhancement-3.mjs`'s `pre-m1`, `post-m1` and `pre-m2` phases fail
    on an already-migrated database by design. **They are not dead:** the live
    database still needs them.
- **`server/.env.test` has no `JWT_SECRET`.** The manual browser check ran with
  a random throwaway secret passed through the process environment.

### Mistakes caught during the work

- After Prompt 4 I reported that nothing in the client imported
  `data/exercises.js`. That was wrong: `client/src/data/muscleGroups.test.js`
  imported it as `./exercises`, which my search for the string
  `data/exercises` did not match. The deletion in Prompt 5 exposed it. That
  test's one exercise-list assertion was removed: its job, every muscle mapping
  to exactly one `MuscleGroup` value, is covered in `MusclePage.test.jsx`.
- Three server lint errors had existed on the branch since before this
  enhancement. They were fixed in their own commit before any schema work.

## Live-database pre-flight checklist (NOT run; required before applying)

Nothing in this section has been executed against the live database. It is
the order of operations for whoever applies this branch to it.

### 0. Before anything

1. Take a restorable backup (a Neon branch of the live project is the simplest).
   **Migration 2 is the point of no return without one.**
2. Confirm where the live database stands:
   ```sql
   SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY migration_name;
   ```
   Expected: the three pre-Enhancement-3 migrations, all finished.
3. The guards on `db-check-enhancement-3.mjs`, `db-explain-leaderboard.mjs` and
   `test:db` accept only `--env-file=.env.test`. Running the check script against
   the live database needs a deliberate, reviewed change to its guard (or an
   equivalent manual run of the same SQL). `prisma/seed.js` accepts any
   explicit `--env-file`; `npm run db:seed` always targets the test database.
4. Recommended, not tested here: give Prisma a `directUrl` (non-pooled) for
   migrations. Both migrations ran through the pooler on the test database
   without trouble, but Prisma's guidance for poolers is to migrate over a
   direct connection.

### 1. Email case: required before Migration 1

Migration 1's `CHECK (email = lower(email))` fails, and the migration is
marked failed, if **any** stored email has an uppercase letter.

Find every mixed-case address:
```sql
SELECT id, email, "createdAt" FROM "User" WHERE email <> lower(email) ORDER BY email;
```

Find accounts that collide once lowercased (these cannot simply be lowercased,
because the unique index would refuse it):
```sql
SELECT lower(email) AS normalized, count(*) AS accounts,
       array_agg(id ORDER BY "createdAt") AS ids
FROM "User" GROUP BY lower(email) HAVING count(*) > 1;
```

Everything each colliding account owns:
```sql
SELECT u.id, u.email, u."createdAt", u."lastChestRankAt", mr.muscle, mr.tier, mr.score, mr."updatedAt"
FROM "User" u LEFT JOIN "MuscleRank" mr ON mr."userId" = u.id
WHERE lower(u.email) = lower($1)
ORDER BY u."createdAt";
```

Decisions a person has to make, for each collision:
- **Which account survives?** The password only works for the account it
  belongs to, so the survivor is the one whose password the owner actually
  uses. Usually that means asking them, not picking the oldest row.
- **What happens to the other account's ranks?** `MuscleRank` is unique per
  `(userId, muscle)`. Ranks for muscles the survivor lacks can be moved
  (`UPDATE "MuscleRank" SET "userId" = <survivor> WHERE "userId" = <other> AND muscle NOT IN (<survivor's muscles>)`);
  for a muscle both have, someone chooses which score stands. The rest is
  deleted.
- **Deleting the other account.** Every foreign key to `User` is
  `ON DELETE RESTRICT`, so its child rows go first. Any token it still holds
  stops working, and a rank request with it answers 500 (foreign-key failure)
  until it expires.

Then lowercase whatever no longer collides, and re-run the first query until
it returns nothing:
```sql
UPDATE "User" SET email = lower(email) WHERE email <> lower(email);
```

The new code looks emails up in lowercase. Until this cleanup is done, a
mixed-case account cannot log in. And if Migration 1 lands while the OLD code
is still running, a mixed-case sign-up hits the CHECK and answers 500 instead
of succeeding.

### 2. Tables that change shape or disappear

```sql
SELECT count(*) FROM "UserLiftsLog";   -- must be 0 before Migration 1
SELECT count(*) FROM "MuscleMastery";  -- Migration 2 deletes this table and its data
```
- `UserLiftsLog`: nothing in the code ever wrote it, so 0 is expected. If not,
  Migration 1 fails, because it adds `score INTEGER NOT NULL`. Old rows are one
  lift each with no score and no attempt grouping, so they cannot be converted
  faithfully. Export them, then decide whether to delete them.
- `MuscleMastery`: nothing used it either. Any rows are lost for good in
  Migration 2. Export them first if they matter.
- **Tiers that may change on screen.** Migration 2 drops the stored tier, and
  every tier is then derived from the score by the current engine. Rows saved
  before Enhancement 2 may hold a tier the current ladder would not give that
  score (Enhancement 2 changed the rounding and chest's Primordial anchor).
  Before Migration 2, compare stored and derived tiers for every live row with
  a read-only script (not written yet), so any user whose displayed tier
  changes is known in advance.

### 3. The migrations, in order

| Order | Migration | What it does | Data at risk |
|---|---|---|---|
| 1 | `20261005115207_e3_additive` | Creates enums `WeightUnit`, `ExerciseDifficulty`, `ExerciseNoteKind`; adds `MuscleRank.lastRankedAt`, filled from `User.lastChestRankAt` (chest) or `updatedAt`, then `NOT NULL DEFAULT now()`; adds the leaderboard index; adds `CHECK (email = lower(email))`; adds `UserLiftsLog.score` and `weightUnit` plus its index; creates `UserLiftsLogEntry` (with its positive-value CHECK), `Exercise`, `ExerciseTarget` and `ExerciseNote`. | None dropped. Fails if any email has uppercase or `UserLiftsLog` has rows. |
| 2 | `20261005120544_e3_drop_replaced` | Drops what Migration 1 replaced, and the unused mastery table. | Everything listed below. |

Sequence around the code:
1. Clean up the data (sections 1 and 2).
2. Apply Migration 1. The old server keeps working on it, apart from mixed-case
   sign-ups.
3. Run the `post-m1` checks: on live data the backfill check finally means
   something.
4. Run `pre-m2`.
5. Apply Migration 2 **and deploy the new server together**. The old server
   writes `tier` and `lastChestRankAt`, which Migration 2 removes; the new
   server cannot insert a rank while `tier` is still `NOT NULL`. Plan a short
   maintenance window.
6. Run `post-m2` and `final`.
7. Seed the catalog with an explicit env file:
   `node --env-file=<live env file> prisma/seed.js`
8. Deploy the client last, so `/api/exercises` exists before the exercise pages
   ask for it.

### 4. Every destructive statement, both migrations

Migration 1 has none. Migration 2, all of it:
1. `ALTER TABLE "MuscleMastery" DROP CONSTRAINT "MuscleMastery_userId_fkey";`
2. `ALTER TABLE "User" DROP COLUMN "lastChestRankAt";` (chest values were copied to `MuscleRank.lastRankedAt` by Migration 1)
3. `ALTER TABLE "MuscleRank" DROP COLUMN "tier";` (re-derived from `score`)
4. `ALTER TABLE "UserLiftsLog" DROP COLUMN "liftName", DROP COLUMN "reps", DROP COLUMN "weight";` (table confirmed empty first)
5. `DROP TABLE "MuscleMastery";` (all its rows)
6. `DROP TYPE "MasteryLevel";`

### 5. What "undo" means at each stage

- **Before Migration 1:** nothing to undo. The email cleanup in step 1 is the
  only data change, and only a backup reverses merged or deleted accounts.
- **Migration 1 fails partway:** Prisma records it as failed in
  `_prisma_migrations` and refuses every later `migrate deploy` until it is
  resolved. Check which statements took effect, undo or finish them by hand,
  then run `prisma migrate resolve --rolled-back 20261005115207_e3_additive`
  (or `--applied` if it was completed by hand) and deploy again.
- **After Migration 1 succeeds:** Prisma has no down migrations. Reversing it
  means a new, reviewed migration that drops what it added. Nothing that
  existed before is lost, but history and catalog rows written since would be.
  Restoring the backup is simpler.
- **Migration 2 fails partway:** same as Migration 1, using
  `prisma migrate resolve` with `20261005120544_e3_drop_replaced` after
  inspecting what was dropped.
- **After Migration 2 succeeds:** the dropped columns and table are gone.
  `lastChestRankAt` survives as `lastRankedAt` for chest and `tier` is
  derivable, but `MuscleMastery`'s rows exist only in the backup. The old
  server cannot run on this schema, so rolling the code back also means
  restoring the database. **This is the point of no return.**

## How this was made

The changes on this branch were implemented by Claude Code (Anthropic) from
prompts I wrote, and I reviewed each commit. Every command that touched a
database ran against the test database only, after I approved it in that
session; the schema and both migrations were shown to me as SQL before they
were created or applied.

Branch: `enhancement-3`. Scope: `server/prisma/*`; the database-facing parts
of the auth, leaderboard and ranking controllers; a narrow, approved addition
to `server/src/ranking/` (`tierOf` and `tierForScore`); the exercise catalog
endpoint; and the client changes that follow from the API contract.

<!-- Edit this section in your own words before submitting. -->
