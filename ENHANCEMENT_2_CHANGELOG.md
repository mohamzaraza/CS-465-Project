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
