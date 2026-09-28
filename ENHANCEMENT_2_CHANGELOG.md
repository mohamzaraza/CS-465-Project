# Enhancement 2 Change Log: Algorithms and Data Structures

Branch: `enhancement-2`. Scope: the chest and back ranking engines under
`server/src/ranking/`, `server/controllers/rankingController.js`, and the
ranking route wiring.

## Baseline (measured before any change)

Everything in this section was measured, not estimated. No source file under
`server/src/ranking/` or `server/controllers/` was modified to produce it.

### Commit

| | |
|---|---|
| Tag | `baseline-before-enhancement-2` |
| Tagged commit | `9f9d1b9` (Enhancement 1: final review, stricter lint rule, dependency audit) |
| Commit the baseline was measured at | `07dcfac` (Update CLAUDE.md scope for Enhancement 2) |

The tag sits one commit behind the measurement. `git diff --stat
baseline-before-enhancement-2 HEAD` shows `CLAUDE.md` and nothing else, so the
ranking code is byte-identical at both commits and the tag is still the correct
"before" marker.

### Benchmark

```
cd server
npm run bench:ranking        # node scripts/benchmark-ranking.mjs
```

Node v22.19.0, win32 x64. 200 warm-up passes, then 7 timed runs of 200 passes
each, where one pass calls the engine once per fixture input for that muscle.
The number reported is the median nanoseconds per call across the 7 runs.

| Run | `computeChestTier` | `computeBackTier` |
|---|---|---|
| 1 | 359.3 ns/call | 369.4 ns/call |
| 2 | 366.5 ns/call | 376.3 ns/call |
| 3 | 356.6 ns/call | 375.5 ns/call |

Micro-benchmark numbers vary by machine, Node version and background load.
These are only useful compared against a later run on the same machine.

### Golden-master fixture

```
cd server
npm run ranking:golden       # node scripts/generate-ranking-golden.mjs
npm run ranking:check        # node scripts/check-ranking-golden.mjs
```

`server/tests/fixtures/ranking-golden.json`, 320,817 bytes, 744 recorded
entries:

| Group | Chest | Back | What it covers |
|---|---|---|---|
| `anchor` | 11 | 11 | every tier's anchor lifts exactly as the engine stores them |
| `threshold-below` | 12 | 12 | 0.01 below each tier's anchor score, plus 0.01 below the Primordial 1RM override |
| `threshold-above` | 12 | 12 | the same thresholds from above |
| `random` | 300 | 300 | seeded realistic lift sets (mulberry32, seed 20250928) |
| `single-lift` | 27 | 27 | one lift at a time across its range |
| `edge` | 7 | 7 | empty input, unknown lift key, zero/negative/fractional weight and reps |
| `knownDefects` | 5 | 1 | the defects below |
| **Total** | **374** | **370** | **744** |

Random-input ranges: chest `bench` 45-500 lb, `incline_db` 10-150, `cable`
5-100; back `lat_pulldown` 30-300, `db_row` 15-150, `deadlift` 95-650; reps
1-20 throughout. The back ranges were chosen to span every back anchor
(`lat_pulldown` 40-260, `db_row` 20-130, `deadlift` 95-600) with headroom.

The fixture contains no timestamp, so regenerating it produces a byte-identical
file (SHA-256 `688aacb603ff46fea91788cd3a84933a0b9e91a37aec2bcb8df828ef76f55097`)
and any diff means behavior moved.

Every recorded `expected` value is what the code does **today**, not what it
should do. Several are wrong on purpose.

### Known defects

| # | Input (lifts) | Current output | What is wrong |
|---|---|---|---|
| 1 | `chest: incline_db 15x8` | `Recruit`, score `158.4` | A score far below the Recruit anchor still returns Recruit. `computeChestTier` seeds `bestTier = "Recruit"` and never reconsiders it, so anything scoring under the Recruit anchor (334.8) is reported as Recruit instead of Untrained. |
| 2 | `chest: incline_db 15x100` | `Celestial`, score `1980.0000000000002` | Unbounded reps let a trivial weight outrank a heavy bench. `incline_db` scores `weight * reps * 1.1` with no rep cap, so 100 reps of a 15 lb dumbbell outscores the Celestial anchor, whose bench is 315 lb. |
| 3 | `chest: bench 415x1` | `Primordial`, score `514.6` | The Primordial override ignores the score entirely. A single bench at 415 lb promotes to the top tier even though the resulting score sits below the Warrior anchor (708.4). |
| 4 | `chest: bench 99999x99` | `Primordial`, score `515994.8399999999` | No upper bound on weight or reps. Nothing rejects physically impossible input, so a 99999 lb bench for 99 reps is scored and stored rather than refused. |
| 5 | `chest: bench 405x1, incline_db 115x4, cable 55x10` | `Primordial`, score `1703.3999999999999` | Chest anchor scores are not strictly increasing: the Primordial anchor scores 1703.4, below Immortal's 2253.2. The loop's `anchorScore >= bestAnchor` guard hides the inversion instead of failing, and the Primordial anchor is dead data because the loop skips that tier. |
| 6 | `back: deadlift 600x1` | `Primordial`, score `334.80000000000007` | Back repeats defect 3. A 600 lb deadlift single promotes to Primordial at a score below back's own Recruit anchor (962.25). |

Sharpest illustration of defect 3, recorded as fixture cases
`chest-override-below` and `chest-override-above`: a bench of **401.6032 lb**
returns `Novice`, and **401.6226 lb** returns `Primordial`. Under 0.02 lb of
difference skips nine tiers.

Three further defects are in scope for Enhancement 2 but are not fixture
inputs, because they are structural rather than input-driven:

- **`computeBackTier` is never imported.** `rankingController.js:94` calls it,
  but line 2 imports only `computeChestTier`. Every `POST /api/rank/back`
  throws `ReferenceError` and returns 500.
- **The anchor and ranking modules import each other.**
  `chestRanking.js` imports `chestTierAnchors.js`, which imports
  `chestRanking.js` back; same for the two back files. Plain Node tolerates the
  cycle because the exported functions are hoisted declarations. Vitest does
  not: entering through a `*Ranking.js` module fails the whole file with
  `ReferenceError: Cannot access '__vite_ssr_import_0__' before initialization`
  at `chestRanking.js:42`, because Vite's SSR transform has not yet assigned
  `CHEST_MULTIPLIER` when the anchors module computes `CHEST_TIER_SCORES` at
  the top level. Importing the anchors module first works, which is why
  `tests/ranking.characterization.test.js` carries a comment forbidding a
  reorder.
- **Two `console.log` calls run at import time**, one per anchors module. They
  print the full tier table on every server start, every test run and every
  script run.

### Wasted work per request

`computeChestTier` scores the user's lifts once, then loops
`CHEST_TIERS_IN_ORDER` (12 entries), `continue`-ing past `Untrained` and
`Primordial`. That leaves **10 tiers**, and each one calls
`computeChestAnchorScore` -> `computeChestScore` on a 3-lift anchor:

| | Chest | Back |
|---|---|---|
| Tiers iterated (12 minus `Untrained` and `Primordial`) | 10 | 10 |
| Lift terms per anchor | 3 | 3 |
| **Anchor lift terms re-scored per request** | **30** | **30** |
| Extra redundant Epley call for the Primordial override | 1 | 1 |
| User lift terms (the only ones that genuinely vary) | 3 | 3 |

So **60 anchor lift terms are recomputed on every ranking request** across the
two engines, and every one of them is a constant: the anchors are module-level
literals that cannot change between requests.

Separately, each anchors module computes `CHEST_TIER_SCORES` /
`BACK_TIER_SCORES` at import time — 11 non-null anchors x 3 lift terms = **33
terms per muscle, 66 total, once per process**. No production code reads either
export: before this commit,
`grep -rn "TIER_SCORES" server client --exclude-dir=node_modules` returned only
the two definitions and the two `console.log` calls, and the only reader added
here is the characterization test asserting the anchor ordering. The one
precomputation that already exists is both unused and the sole reason for the
import-time logging.

### What this section is for

Nothing above is fixed yet. Prompt 1 only establishes the "before" picture so
that every later change can be checked against it: `npm test` fails if any of
the 744 recorded outputs moves, and `npm run bench:ranking` says whether the
engine got faster on the same machine.

## Files added in this commit

| File | Purpose |
|---|---|
| `server/scripts/generate-ranking-golden.mjs` | Builds the fixture from the live engines. Seeded, no dependencies, no timestamp. |
| `server/scripts/check-ranking-golden.mjs` | Replays the fixture under plain Node and exits non-zero on any mismatch. |
| `server/scripts/benchmark-ranking.mjs` | Times both engines over the fixture inputs. |
| `server/tests/fixtures/ranking-golden.json` | The 744 recorded outputs. Generated; do not hand-edit. |
| `server/tests/ranking.characterization.test.js` | 27 tests: every fixture entry, the known values, the known defects, and the checker script as a subprocess. |
| `server/package.json` | Three script entries. No dependencies added. |

## After Prompt 2: one config-driven engine

Behavior-preserving refactor. The two hand-copied engines are gone, replaced by
one engine built from data. **Nothing in
`server/tests/fixtures/ranking-golden.json` changed** — not a case, not a score,
not a known defect. The fixture was not regenerated and not edited; `git diff
--stat 701860f -- server/tests/fixtures` prints nothing.

The deliberate fixes (the Primordial override, input bounds, rounding, the
broken back route) are Prompt 3's job. Every defect listed above is still
present and still pinned.

### Structure

| Before | After |
|---|---|
| `chestRanking.js`, `chestTierAnchors.js` | — |
| `backRanking.js`, `backTierAnchors.js` | — |
| `src/config/muscleMultipliers.js` | — |
| two copies of `epley1RM`, volume products inlined at six call sites | `src/ranking/formulas.js` — each formula written once |
| anchors + multipliers + tier order split across two files per muscle, each importing an engine | `src/ranking/rankingConfig.js` — pure data, **imports nothing** |
| two near-identical `computeXTier` / `computeXAnchorScore` / loop implementations | `src/ranking/rankingEngine.js` — `createRankingEngine(config)` + `findTier(thresholds, score, floorTier)` |
| importers reached into individual engine files | `src/ranking/index.js` — builds both engines at import time, keeps the old export names as thin wrappers, adds `rankLifts(muscle, lifts)` |

`rankingConfig.js` names its formulas by string (`"epley1RM"`, `"volume"`) rather
than importing them. That is what makes the config inert data, and it is why
"unknown formula" is a validation error the engine can actually raise.

### Work per request

| | Before (per muscle) | After (per muscle) |
|---|---|---|
| Anchor lift terms re-scored per request | **30** (10 tiers x 3 lifts) | **0** |
| Comparisons per tier lookup | **10** — one per tier, each preceded by rescoring that tier's anchor | **at most 4** — `ceil(log2(10 + 1))` |
| Redundant Epley call for the override | 1 | 1 (unchanged; the override reads the unfactored 1RM) |
| User lift terms — the only ones that vary | 3 | 3 |

Across both muscles that is **60 anchor lift terms per request down to 0**. Every
one of them was a constant: the anchors are literals that cannot change between
requests.

The comparison bound is not just asserted in prose — `ranking.engine.test.js`
counts the comparisons through a getter on `min` and fails if `findTier` exceeds
`ceil(log2(n + 1))`, for ladders of 1, 2, 3, 7, 8, 10 and 1000 tiers.

### One-time startup work

Building both engines scores 10 anchors x 3 lift terms = **30 terms per muscle,
60 total, once per process**, then validates each config.

This is not new cost. The old anchors modules already computed
`CHEST_TIER_SCORES` / `BACK_TIER_SCORES` at import — 11 anchors x 3 terms = 33
terms per muscle, 66 total — and used them for nothing but an import-time
`console.log`. Startup work went from 66 wasted terms to 60 useful ones. The
precomputation that already existed was simply pointed at the request path
instead of at stdout.

Validation adds 9 threshold comparisons per muscle plus the tier, lift and
formula checks. A config that fails any of them throws from `index.js` at import
time, so a bad ladder takes the server down on startup instead of silently
misranking a user hours later.

### Time complexity, in words

**Before.** Every ranking request scored the user's lifts once, then walked the
tier ladder from the bottom, and *recomputed that tier's anchor score from its
raw lift data at every step*. Linear in the number of tiers, and each step cost a
full re-scoring rather than a comparison — so linear in tiers times lift terms
per anchor, on every request, for constants that never changed.

**After.** The anchor scores are computed once when the process starts and kept
in a sorted array. A request scores the user's lifts once — unavoidable, it is
the only thing that varies — and then finds the tier by halving the ladder,
which is logarithmic in the number of tiers and costs one comparison per step.
The per-request anchor work is gone entirely rather than reduced.

### Benchmark

```
cd server
npm run bench:ranking        # node scripts/benchmark-ranking.mjs
```

Same script, same machine, same method as the baseline: Node v22.19.0, win32
x64, 200 warm-up passes then 7 timed runs of 200 passes each, median
nanoseconds per call. Building the engines is *not* timed — it happens once at
import, before the first measurement, which is the whole point of moving the
anchor scoring out of the request path.

| Run | `computeChestTier` before | after | `computeBackTier` before | after |
|---|---|---|---|---|
| 1 | 359.3 ns/call | **124.5 ns/call** | 369.4 ns/call | **101.9 ns/call** |
| 2 | 366.5 ns/call | **128.6 ns/call** | 376.3 ns/call | **106.3 ns/call** |
| 3 | 356.6 ns/call | **127.1 ns/call** | 375.5 ns/call | **115.5 ns/call** |
| median of the three | 359.3 | **127.1** | 375.5 | **106.3** |

Roughly 2.8x faster for chest and 3.5x faster for back.

### Honest reading of the benchmark

With about 10 tiers, **a user would not feel this**. Both versions answer a
ranking request in well under a microsecond, and the request is dominated by the
database round-trip either side of it. Micro-benchmark numbers also vary by
machine, Node version and background load, so the columns below are only
comparable to each other because they were measured on the same machine minutes
apart.

The value of this change is not the nanoseconds. It is:

1. **Repeated work removed.** 60 constant lift terms per request became 0.
2. **A valid ordering guaranteed.** The ladder is checked to be strictly
   increasing at startup. Before, the loop's `anchorScore >= bestAnchor` guard
   silently *hid* an out-of-order anchor; chest's inverted Primordial anchor sat
   there undetected. Now an inversion inside the ladder is a startup crash that
   names the muscle and both tiers.
3. **A new muscle is a data change.** `ranking.engine.test.js` builds a working
   engine from a third, fictional muscle config defined inside the test — no new
   engine file, no new formula, no edit to `rankingEngine.js`.

### Also fixed in this commit

- **The circular import is gone.** `rankingConfig.js` imports nothing;
  `rankingEngine.js` imports only `formulas.js`; `index.js` imports those two.
  `ranking.imports.test.js` reads the real directory, extracts each module's
  relative imports, and proves the graph acyclic with a depth-first search — and
  it tests the detector itself against a two-node cycle, a self-import, a longer
  cycle and a diamond, so a detector that always returned "acyclic" would fail.
  The import-order comments and workarounds are removed from
  `ranking.characterization.test.js` and the three scripts, and that test now
  imports the ranking modules in four different orders to prove the order no
  longer matters. `tests/app.test.js` no longer needs to mock the engine away.
- **The two import-time `console.log` calls are gone**, along with the
  `CHEST_TIER_SCORES` / `BACK_TIER_SCORES` tables that only existed to feed them.
  The characterization test rebuilds the same table locally from the anchor data,
  so the assertions it had are unchanged.
- **`server/src/config/muscleMultipliers.js` is deleted.** It was imported by
  nothing in `server/` or `client/`, and it disagreed with the live engine: it
  listed `back: 1.25` where `BACK_MULTIPLIER` was, and remains, `1.2`. The live
  value is the one in `rankingConfig.js`; the fixture records 1.2 for both
  muscles. Its other eleven entries name muscles that have no ranking engine.

### Still deliberately broken

`rankingController.js` changed by exactly one line — its import path. It still
does **not** import `computeBackTier`, so `POST /api/rank/back` still throws a
`ReferenceError` and returns 500. That is Prompt 3's fix, and leaving it here
keeps this commit a pure refactor.

### Files in this commit

| File | Change |
|---|---|
| `server/src/ranking/formulas.js` | Added. `epley1RM` and `volume`, plus a name lookup. |
| `server/src/ranking/rankingConfig.js` | Added. Chest and back as data; the anchor tables moved here verbatim. |
| `server/src/ranking/rankingEngine.js` | Added. Config validation, threshold precomputation, `findTier` binary search. |
| `server/src/ranking/index.js` | Added. Builds both engines at import, re-exports the old names, adds `rankLifts`. |
| `server/src/ranking/chestRanking.js`, `chestTierAnchors.js`, `backRanking.js`, `backTierAnchors.js` | Deleted. |
| `server/src/config/muscleMultipliers.js` | Deleted. Dead and wrong. |
| `server/controllers/rankingController.js` | Import path only. |
| `server/scripts/generate-ranking-golden.mjs`, `check-ranking-golden.mjs`, `benchmark-ranking.mjs` | Imports repointed at `index.js`; the now-false import-cycle comments removed. No change to the generator's logic. |
| `server/tests/ranking.characterization.test.js` | Import-order comment and workaround removed; four import-order cases added; the deleted `TIER_SCORES` tables rebuilt locally. |
| `server/tests/ranking.fixture-exact.test.js` | Added. Every fixture score asserted with `toBe` — bit equality, no tolerance. |
| `server/tests/ranking.engine.test.js` | Added. `findTier` against a linear-scan reference and at boundaries; every validation failure; a third muscle built from data. |
| `server/tests/ranking.imports.test.js` | Added. Import-graph cycle detection, plus a self-test of the detector. |
| `server/tests/app.test.js` | Dead `vi.mock` of the ranking engine removed. |

## Behavior changes (Prompt 3)

Everything above this line was a refactor: the golden master proved that no
output moved. This section is the opposite. Every change here was approved before
it was written, and the diff it produced is asserted entry by entry in
`server/tests/ranking.behavior-changes.test.js`. `ranking-golden.json` (v1) is
untouched and is never regenerated; `ranking-golden-v2.json` is the fixture the
engine is now held to.

### What changed, and on whose authority

| Problem | Decision approved | Change | Files | How it was verified |
|---|---|---|---|---|
| Chest's Primordial anchor scored 1703.4, **below** Immortal's 2253.2, so the ladder was not increasing at the top. The inversion was invisible because a 1RM override owned the tier and the ladder skipped it. | Option A: keep every tier from Untrained through Immortal exactly as it is; replace the chest Primordial anchor with one that sits above Immortal, chosen by continuing the ladder's own step. | Chest Primordial is now **bench 415x4, incline_db 115x8, cable 55x12 = 2491.6** (gap +238.4 over Immortal, ratio 1.1058). Celestial to Immortal steps +50 lb bench, +10 lb incline_db, +5 lb cable at reps 4/8/12, so Primordial repeats that step once. Back's anchor already scored 5826.0, above Immortal's 5501.4, so **back's anchor did not change**. | `rankingConfig.js` (data only) | `ranking.rounding.test.js` asserts startup validation would now **refuse** the old anchor, naming both tiers. `ranking.behavior-changes.test.js` pins the 140 entries that change tier. |
| The `bench 1RM >= 415` override ranked a bench-only lifter Primordial, ignoring the other two lifts: bench 401.6032 lb gave Novice, 401.6226 lb gave Primordial - nine tiers for 0.0194 lb. Back had the same rule on `deadlift >= 600`. | Delete the override rule and every line that existed only for it. | Both `override` blocks deleted from the config; the override validation and the `overrideRule` branch in `rank()` deleted from the engine. Primordial joined the ladder (`SCORED_TIERS` is now `slice(1)`), so all 11 scored tiers are searched and validated. A config that re-adds `override` is now a **startup error**, not a silently ignored field. | `rankingConfig.js`, `rankingEngine.js` | `ranking.characterization.test.js` turns each old DEFECT test into its FIXED counterpart. The engine test asserts the resurrected key is refused by name. |
| The server scored whatever arrived: no required lifts, no bounds. A 99999 lb bench for 99 reps scored 515994.84 and was stored. | Add a validation layer driven by the muscle config; require every configured lift; bound weight per lift and reps globally. | New `server/src/ranking/validateLifts.js`, a pure function returning `{ ok: true, lifts }` or `{ ok: false, errors }` with one message per problem, naming the lift and the field. `rank()` is left as a pure scorer that assumes valid input, which is why every realistic score is still computed exactly as before. | `validateLifts.js`, `rankingEngine.js`, `rankingController.js` | `tests/validateLifts.test.js`: 55 cases covering every rejection, both boundaries of every bound, and a happy path per muscle. |
| A score was rounded in the controller **after** the tier had been chosen from the unrounded value, so a stored score could not be trusted to re-derive its stored tier. | Round once, in `rank()`, and classify from the rounded value against thresholds rounded the same way. | `rank()` rounds first and returns that integer; thresholds are rounded at startup; `assertStrictlyIncreasing` now runs on the **rounded** ladder and throws naming both tiers if rounding merges two. The controller stores `result.score` directly instead of rounding again. | `rankingEngine.js`, `rankingController.js` | `ranking.rounding.test.js`: a property test over **6000** seeded random valid inputs (3000 per muscle) asserts `findTier(thresholds, result.score)` equals `result.tier`, plus a case proving a config whose anchors collide only after rounding is refused. |
| `POST /api/rank/back` returned 500 for every request: `rankBack` called `computeBackTier`, which the controller never imported. | Compute and return the result **without saving and without a cooldown**, and say why in the code. | The chest and back handlers are replaced by one `createRankHandler(muscle)` factory driven by a per-muscle table. Back's entry is `saves: null`. The `TODO` and the dead code are gone. | `rankingController.js` | `tests/rankingController.test.js`: 25 supertest cases with `vi.mock` on `lib/prisma.js`. |

### The exact bounds

Stored as data on each lift in `rankingConfig.js`, so a new muscle sets its own
and nothing in `validateLifts.js` changes.

| Muscle | Lift | Weight (lb) | Reps | Heaviest realistic weight in the fixture |
|---|---|---|---|---|
| chest | `bench` | 1 - 1000 | 1 - 30, whole | 500 |
| chest | `incline_db` | 1 - 300 | 1 - 30, whole | 150 |
| chest | `cable` | 1 - 300 | 1 - 30, whole | 100 |
| back | `lat_pulldown` | 1 - 600 | 1 - 30, whole | 300 |
| back | `db_row` | 1 - 300 | 1 - 30, whole | 150 |
| back | `deadlift` | 1 - 1500 | 1 - 30, whole | 650 |

Weight may be fractional (half-pound plates are real); reps may not. Each maximum
is roughly two to three times the heaviest weight the generator produces for that
lift. They were **not** derived from competition records: no network was available
and inventing record figures would be worse than admitting that. Their job is to
refuse the physically impossible, not to judge anyone's training.

Two knock-on effects, both deliberate and both asserted in tests rather than left
to be discovered:

- **`Untrained` is no longer reachable through the API.** Every lift must be at
  least 1 lb for 1 rep, so no accepted input can score 0. `Untrained` now means
  "never ranked" - which is what the client already shows, since it renders no
  rank box until `GET /rank/chest/me` returns a row.
- **The `floorTier` defect is still open.** A score below the Recruit anchor is
  still reported as Recruit rather than Untrained. It was not one of the approved
  changes, so it was left alone. It is recorded in v2 as
  `chest-open-floor-tier-below-recruit` (a complete set scoring 81 against a
  Recruit threshold of 335), and exactly one fixture entry (`back-random-094`,
  518 against a threshold of 962) still lands on it.

### What the rep cap does and does not fix

The cap closes the *absurd* inputs and nothing more. Said plainly: **the volume
exploit is reduced, not closed.**

| Input | Before | After |
|---|---|---|
| `incline_db` 15 lb x 100 reps, alone | Celestial @ 1980 | **rejected** (reps cap, and two lifts missing) |
| `bench` 99999 lb x 99 reps, alone | Primordial @ 515994.84 | **rejected** (weight cap, reps cap, two lifts missing) |
| `incline_db` 15 lb x 30 reps, alone | - | **rejected** - by the *required-lifts* rule, not the cap |
| `bench` 45x1, `incline_db` 15x30, `cable` 5x1 | - | Novice @ 655 |
| `bench` 45x30, `incline_db` 15x30, `cable` 5x30 | - | Warrior @ 864 |
| **`bench` 135x30, `incline_db` 45x30, `cable` 20x30** | - | **Primordial @ 2754** |
| **back `lat_pulldown` 130x30, `db_row` 65x30, `deadlift` 225x30** | - | **Primordial @ 10539** |

The last two rows are the honest answer: those are the *Heroic* anchor's own
weights, claimed for 30 reps each, and they reach the top tier. `volume` is
`weight * reps` with nothing to damp it, so the score is linear in reps right up
to the cap. Closing this properly means changing the formulas - a rep-range
decay, or scoring an estimated 1RM only - which would move every tier and was
explicitly out of scope. Both cases are recorded in v2 as
`chest-open-rep-cap-does-not-close-volume` and
`back-open-rep-cap-does-not-close-volume`, with `status: "open"`.

### The back route

`POST /api/rank/back` now answers **200** with `{ muscle, tier, score }` and saves
nothing. Persisting a back rank would need schema work that belongs to
Enhancement 3: the cooldown reads `User.lastChestRankAt`, a chest-only column, so
a saved back rank would either have to share chest's cooldown or wait for a
per-muscle column. The controller says so at the point where it decides.

Note the shape difference this leaves, which was raised and accepted: chest
returns the saved Prisma row, whose `tier` is the uppercase enum (`"HEROIC"`),
while back returns the engine result in title case (`"Heroic"`). Chest's shape is
frozen by the client contract and was not touched.

### Fixture v2: the diff from v1, by reason

744 v1 entries, all still present; 47 added. Of the 744, every one falls into
exactly one bucket, and `ranking.behavior-changes.test.js` asserts each count
against a hard-coded expectation - a computed expectation would agree with
whatever the code happened to do.

| Reason | Entries |
|---|---|
| Now-invalid input | **391** |
| Demoted from Primordial (was an override promotion) | **81** |
| Promoted to Primordial (score clears the new anchor) | **59** |
| Score rounded, tier unchanged | **207** |
| Unchanged entirely | **2** |
| Input changed (derived from chest's Primordial anchor) | **4** |
| **Total** | **744** |

Reading the table:

- **No tier moved for any reason other than the Primordial ladder.** Rounding
  changed 207 scores and not one tier. That is asserted directly, so if a future
  change ever tips a score across a threshold it fails loudly.
- All 207 rounding entries are **exactly** `Math.round` of their v1 score, and the
  2 unchanged entries (`chest-random-018`, `back-anchor-Primordial`) are the ones
  whose v1 score was already the rounded value.
- Of the 391 now-invalid entries, **377 are refused only for missing lifts** and
  just **10** break a bound at all - of which only **2** exceed a *maximum*
  (`chest-defect-no-input-bounds` and `chest-defect-unbounded-volume`). The other
  8 are the zero and negative edge cases. So "every lift is required" is the
  load-bearing rule; the bounds refuse almost nothing the fixture contains, which
  is exactly what generous limits are supposed to do.
- The 4 input-changed entries are `chest-anchor-Primordial`,
  `chest-threshold-Primordial-below`, `chest-threshold-Primordial-above` and
  `chest-defect-anchors-not-monotonic` - all built *from* the anchor that moved.
  They are declared in the fixture as `inputsChangedSinceV1`, and the test asserts
  no other entry's input changed, so an output change cannot hide as an input
  change.

The 47 added entries are 44 `-rounded-` threshold probes (11 tiers x 2 sides x 2
muscles) and 3 `-open-` defect entries. The probes are new because v1's threshold
probes were all single-lift and are now refused, which recorded a rejection but
pinned nothing about where a tier begins. The new probes are complete lift sets
solved to land exactly **on** a rounded threshold and 0.51 **below** it - 0.51
rather than 0.01 because the boundary moved: the first score that misses tier N is
now N - 0.51, since N - 0.01 rounds back up into the tier.

### Scripts

`npm run ranking:golden` now writes **`ranking-golden-v2.json`** and no longer
writes v1. `npm run ranking:check` replays v2, including every recorded rejection
message, and additionally asserts that every accepted score is a whole number and
that the rounded ladder strictly increases. `npm run bench:ranking` deliberately
still reads v1 - it uses the fixture only as a source of *inputs*, and timing the
same inputs is what keeps its numbers comparable with the baseline above.

### Files in this commit

| File | Change |
|---|---|
| `server/src/ranking/validateLifts.js` | Added. Pure, config-driven input validation; reports every problem, never throws. |
| `server/src/ranking/rankingConfig.js` | Per-lift `bounds` added; chest's Primordial anchor replaced; both `override` blocks deleted; `SCORED_TIERS` now includes Primordial. |
| `server/src/ranking/rankingEngine.js` | Override support deleted. Bounds validated at startup; unknown config and lift keys refused; thresholds rounded; `rank()` rounds once and classifies from the rounded score; engines expose `validate`. |
| `server/src/ranking/index.js` | `validateLifts(muscle, lifts)` added; `rankLifts` documented as assuming valid input. |
| `server/controllers/rankingController.js` | Both handlers replaced by one `createRankHandler(muscle)` factory. Validation before the cooldown read; 400 with `{ error, errors }`; back computes without saving; `TODO` and dead code removed. |
| `server/routes/rankingRoutes.js` | Unchanged - the export names and the `asyncHandler` wrapping are the same. |
| `server/scripts/generate-ranking-golden.mjs` | Writes v2; records rejections; new `-rounded-` probe group; defect entries carry `status` and `resolution`; fixture records `thresholds`, `bounds` and `inputsChangedSinceV1`. |
| `server/scripts/check-ranking-golden.mjs` | Replays v2, checks rejection messages, integer scores and the rounded ladder. |
| `server/scripts/benchmark-ranking.mjs` | Comment only, explaining why it still reads v1. |
| `server/tests/fixtures/ranking-golden-v2.json` | Added. 782 cases + 9 known defects. |
| `server/tests/fixtures/ranking-golden.json` | **Untouched.** Kept as the v1 baseline. |
| `server/tests/ranking.behavior-changes.test.js` | Added. Holds v1 and v2 side by side and asserts the changed set is exactly the approved one. |
| `server/tests/validateLifts.test.js` | Added. Every rejection, both boundaries, both muscles. |
| `server/tests/ranking.rounding.test.js` | Added. The 6000-input property test, the rounding boundary, and the rounded-ladder startup validation. |
| `server/tests/rankingController.test.js` | Added. Chest's contract, the cooldown, 400, 401, 500, and the working back route. |
| `server/tests/ranking.characterization.test.js` | Retargeted at v2; each fixed DEFECT test replaced by its FIXED counterpart; the two open defects kept as open. |
| `server/tests/ranking.fixture-exact.test.js` | Retargeted at v2; rejection messages asserted bit-for-bit alongside scores. |
| `server/tests/ranking.imports.test.js` | Import graph updated for `validateLifts.js`. |
| `server/tests/ranking.engine.test.js` | Override tests removed with the feature; bounds-validation and unknown-key tests added; ladder length 10 to 11. |
| `client/**` | **No change.** The chest contract did not move, and the 400 body only gained a field. See the note below. |

### One thing the client will now see

`client/src/components/colosseum/LiftRankForm.jsx` validates weight above 0 and
reps as a whole number above 0, with no upper limit. A user who enters 40 reps, or
a 2000 lb bench, will now pass the client's check and get a 400 from the server
with a clear message instead of a rank. Nothing breaks - `apiRequest` surfaces the
`error` string, and the form already shows it in its `role="alert"` - but the
client's limits and the server's no longer agree. Bringing them into line is a
client change, and this prompt's scope was the server, so it was not made.

## Data structures (Prompt 4)

Two changes: the leaderboard now gives tied scores the same rank, and a new
`GET /api/leaderboard/total` sums each user's scores across muscles and picks
the top 20 with a min-heap. No field the chest leaderboard returns was changed,
added or removed; `prisma/*` and `server/tests/fixtures/*` are untouched; no
dependency was added.

### The tie-ranking bug

`getChestLeaderboard` numbered rows `index + 1`, so two lifters with the same
score got different ranks, and which of them came "first" was whatever order
the database happened to return equal rows in.

| Score | Before (`index + 1`) | After (`rankWithTies`) |
|---|---|---|
| 900 | 1 | 1 |
| 800 | 2 | **2** |
| 800 | 3 | **2** |
| 700 | 4 | 4 |

The fix is "competition ranking" (1, 2, 2, 4): tied scores share a rank and
the next rank skips, so a rank always means "1 + how many people scored
higher". A single row is still rank 1, and rows with distinct scores get the
same ranks as before. `rankWithTies` lives in the pure module
`server/src/ranking/leaderboard.js` and does not mutate its input.

### A deterministic tie-break for the chest query

The chest query's `orderBy` went from `{ score: "desc" }` to
`[{ score: "desc" }, { userId: "asc" }]`. It adds no column and touches no
schema, and it only changes the order of rows that are tied today. Without it,
lifters tied at the 20th/21st cutoff could swap in and out between requests,
and the chest and total endpoints would break ties differently. Everything
else in the query (`where`, `take: 20`, `include: { user: { select: { email } } }`)
is unchanged. `userId` was chosen over a creation time because `MuscleRank`
has no `createdAt`, and `User.createdAt` would need an extra joined column.

### Min-heap top-K: what it costs versus sorting everything

`topK(items, k, compare)` keeps the best k seen so far in a size-k binary
min-heap whose root is the *worst* of them. Each new item costs one comparison
against the root to reject; only an item that beats the root pays O(log k) to
replace it. At the end the heap is popped into best-first order.

| | Sort everything, then slice | Min-heap top-K |
|---|---|---|
| Time | O(n log n) | O(n log k) |
| Extra space | O(n) (the sorted copy) | O(k) (the heap) |
| Comparator calls, n = 10,000, k = 20, seeded random scores | 119,860 | 10,926 |

The heap is array-backed: a complete binary tree packs into contiguous
storage with children at `2i + 1` and `2i + 2` and the parent at
`(i - 1) >> 1`, so there are no node objects or pointers. `MinHeap` has
`push`, `pop`, `peek` and `size`, plus `replaceTop`, which `topK` uses to
swap out the root in one sift instead of a `pop` then a `push`.

**Ties.** A heap is not stable, so `topK` carries each item's original index
as the final tie-break. Items the comparator calls equal come out in input
order, exactly as a stable `sort` followed by `slice(0, k)` returns them. The
tests compare against stable sort-then-slice on seeded inputs with heavy ties
(scores 0-9 and 0-49 over 3,000-5,000 items) as well as few ties. On top of
that, the total leaderboard's comparator itself breaks ties by lower `userId`,
matching the chest query.

**The complexity claim is tested, not just stated.**
`tests/leaderboard.test.js` counts comparator calls through a wrapper and
asserts fewer than `n * (ceil(log2(k)) + 2)` = 70,000 for n = 10,000, k = 20
(the real count is 10,926). It also asserts that a full sort of the same input
goes *over* that bound (119,860), so the test would catch an implementation
that quietly sorted everything.

### Benchmark

```
cd server
node scripts/benchmark-topk.mjs
```

k = 20, seeded random scores (0-99,999) with the total leaderboard's
comparator (score descending, then id). Node v22.19.0, win32 x64. Five warm-up
runs, then the median of 9 timed runs, in microseconds per call. The script
first checks that both methods return identical results.

| n | Run | heap topK (us) | sort + slice (us) | sort / heap |
|---|---|---|---|---|
| 1,000 | 1 | 21.2 | 234.1 | 11.0x |
| 1,000 | 2 | 21.3 | 227.7 | 10.7x |
| 1,000 | 3 | 20.7 | 229.3 | 11.1x |
| 10,000 | 1 | 129.2 | 3,215.7 | 24.9x |
| 10,000 | 2 | 138.6 | 3,237.1 | 23.4x |
| 10,000 | 3 | 130.1 | 3,230.5 | 24.8x |
| 100,000 | 1 | 1,159.3 | 49,306.1 | 42.5x |
| 100,000 | 2 | 1,140.0 | 49,852.2 | 43.7x |
| 100,000 | 3 | 1,144.3 | 49,826.3 | 43.5x |

**Honest reading.** On this machine the heap won at every size measured,
including n = 1,000, and the gap grows with n as O(n log n) versus O(n log k)
predicts. Sort did not win at small n here, but it can on other machines or
with a cheaper comparator (plain number subtraction instead of a
score-then-string comparison). The expensive comparator helps the heap,
because the heap calls it about ten times less often. Micro-benchmark numbers
vary by machine, Node version and background load; the columns are only
comparable to each other because they were measured on the same machine in
the same run. At this app's real size (tens of users) both take microseconds,
and the request is dominated by the database round-trip.

### Why the total leaderboard sums in a Map first

The heap needs one number per user, but the database returns one row per user
per muscle. A single pass over the rows adds each score into a `Map` keyed by
`userId`: O(n) time for n rows, O(u) space for u users. Only then does `topK`
run over the u totals: O(u log 20). A user who has ranked only some muscles
simply has fewer rows to add; their total is the sum of the muscles they have.
Prisma's `groupBy` could sum in the database, but it cannot return the related
`user.email`, and the response must keep that field for now.

### Where the heap earns its keep, and where it does not

For the existing 20-row chest query, **the database already sorts and limits**
(`orderBy` plus `take: 20`), so the chest endpoint gains nothing from a heap
and does not use one; it only uses `rankWithTies`. The heap earns its keep
only where the app has to aggregate across rows itself, as the total
leaderboard does, and so must pick the top 20 from values the database never
sorted.

### Known limits of the total endpoint (deliberately not fixed here)

- **No pagination.** The total query reads every user's rank rows (at most 13
  per user, three columns each via `select`) on every request. That is fine at
  this app's size, not at large scale, where a database-side aggregate or a
  maintained total column would be needed. Pagination and caching were out of
  scope for this prompt.
- **Emails are public here too.** `/api/leaderboard/total` returns the `user`
  (email) field exactly like the chest endpoint. Both endpoints build their rows
  through one shared function, `toLeaderboardRow` in
  `server/controllers/leaderboardController.js`, so Enhancement 3 can remove
  email in that single place.
- **`tier` is `null` on total rows.** Tiers are per muscle and there is no
  cross-muscle tier, so none is invented. Both endpoints still return exactly
  `{ rank, user, tier, score }`. The client's `LeaderboardRow` would show
  "Unknown" for a null tier, which is harmless while the client does not call
  `/total`, and it does not.

### Files in this commit

| File | Change |
|---|---|
| `server/src/ranking/leaderboard.js` | Added. Pure `rankWithTies`, `MinHeap`, `topK`; no Prisma or Express imports. |
| `server/controllers/leaderboardController.js` | `LEADERBOARD_LIMIT = 20`; shared `toLeaderboardRow`; chest ranks from `rankWithTies` plus the `userId` tie-break; new `getTotalLeaderboard`. |
| `server/routes/leaderboardRoutes.js` | `GET /total` added, wrapped in `asyncHandler` like `/chest`. |
| `server/tests/leaderboard.test.js` | Added. `rankWithTies` cases, `MinHeap` against `Array.sort`, `topK` against stable sort-then-slice, edge cases, comparator-count bound. |
| `server/tests/leaderboardController.test.js` | Added. Chest query and fields, tie-aware ranks, total sums, limit, order, 500s, shared field shape. |
| `server/tests/ranking.imports.test.js` | `leaderboard.js` added to the expected import graph, as a leaf. |
| `server/scripts/benchmark-topk.mjs` | Added. topK versus sort-then-slice at n = 1,000 / 10,000 / 100,000. |
| `client/src/components/colosseum/TotalLeaderboard.jsx` | React key changed from `row.rank` to `${row.rank}-${row.user}`, since tied rows now share a rank. Approved client change; the only place that keys leaderboard rows (`ColosseumPage.jsx` renders none itself). |
| `client/src/components/colosseum/TotalLeaderboard.test.jsx` | Added. Two tied rows render with no duplicate-key warning; the test fails on the old key. |
