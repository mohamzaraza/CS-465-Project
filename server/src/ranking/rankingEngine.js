// One engine for every muscle, built from the data in rankingConfig.js.
//
// What changed versus the two hand-copied engines this replaces:
//   - anchor scores are computed once, when the engine is built, instead of
//     once per tier on every request;
//   - the ladder is checked to be strictly increasing at build time, so a bad
//     anchor is a startup crash rather than a silently wrong rank;
//   - the tier lookup is a binary search over that sorted ladder instead of a
//     linear scan that rescored every anchor as it went.
//
// The arithmetic and its order are still untouched, so a realistic set scores
// the same double it always did. What Prompt 3 changed on purpose:
//   - the 1RM override rule is gone, along with the code that served it, so
//     every tier including Primordial is reached by score alone;
//   - a score is rounded to a whole number ONCE, and the tier is classified from
//     that integer against integer thresholds, so the stored score always
//     re-derives the stored tier;
//   - rank() no longer decides what legal input is; validateLifts does.
// ranking-golden-v2.json pins the result, and ranking.behavior-changes.test.js
// pins the exact difference from v1.

import { FORMULAS } from "./formulas.js";
import { validateLifts } from "./validateLifts.js";

// Every key a config may carry. Listed so a typo, or a rule someone brings back
// after it was deliberately deleted (the old `override`), is a startup error
// instead of a field the engine silently ignores.
const CONFIG_KEYS = new Set([
  "muscle",
  "multiplier",
  "lifts",
  "tierOrder",
  "zeroTier",
  "floorTier",
  "ladder",
  "anchors",
]);

const LIFT_KEYS = new Set(["key", "formula", "factor", "bounds"]);

function configError(muscle, message) {
  return new Error(`ranking config for "${muscle}": ${message}`);
}

// Reported as a list rather than one name at a time so a config with several
// duplicates is fixed in one pass.
function duplicates(values) {
  const seen = new Set();
  const dupes = new Set();
  for (const value of values) {
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }
  return [...dupes];
}

function quote(values) {
  return values.map((value) => `"${value}"`).join(", ");
}

// The bounds are what validateLifts enforces on every request, so a config that
// ships nonsense here (a max below the min, a fractional rep cap) would reject
// legitimate input for as long as nobody noticed. Checked at startup instead.
function validateBounds(muscle, lift) {
  const { bounds } = lift;

  if (!bounds || typeof bounds !== "object") {
    throw configError(muscle, `lift "${lift.key}" needs input bounds for weight and reps`);
  }

  for (const field of ["weight", "reps"]) {
    const limits = bounds[field];
    if (!limits || typeof limits !== "object") {
      throw configError(muscle, `lift "${lift.key}" needs ${field} bounds with a min and a max`);
    }
    for (const edge of ["min", "max"]) {
      const value = limits[edge];
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw configError(
          muscle,
          `lift "${lift.key}" needs a finite ${field} ${edge}, got ${value}`
        );
      }
    }
    if (limits.min > limits.max) {
      throw configError(
        muscle,
        `lift "${lift.key}" has a ${field} min of ${limits.min} above its max of ${limits.max}`
      );
    }
    // A non-positive minimum would let a 0 lb lift through, and the zero-tier
    // escape hatch then reports Untrained for what looks like a real attempt.
    if (limits.min <= 0) {
      throw configError(
        muscle,
        `lift "${lift.key}" needs a ${field} min above 0, got ${limits.min}`
      );
    }
  }

  // Reps are counted, not measured: a fractional bound could only ever be a
  // mistake, and validateLifts already refuses fractional reps.
  for (const edge of ["min", "max"]) {
    if (!Number.isInteger(bounds.reps[edge])) {
      throw configError(
        muscle,
        `lift "${lift.key}" needs a whole-number reps ${edge}, got ${bounds.reps[edge]}`
      );
    }
  }
}

function validateConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("ranking config: expected an object");
  }

  const { muscle, multiplier, lifts, tierOrder, ladder, anchors, zeroTier, floorTier } = config;

  if (typeof muscle !== "string" || muscle === "") {
    throw new Error('ranking config: "muscle" must be a non-empty string');
  }

  const unknownKeys = Object.keys(config).filter((key) => !CONFIG_KEYS.has(key));
  if (unknownKeys.length > 0) {
    throw configError(
      muscle,
      `unknown config key(s) ${quote(unknownKeys)}; a config may only set ` +
        `${quote([...CONFIG_KEYS])}`
    );
  }

  if (typeof multiplier !== "number" || !Number.isFinite(multiplier) || multiplier <= 0) {
    throw configError(muscle, `multiplier must be a positive finite number, got ${multiplier}`);
  }

  if (!Array.isArray(lifts) || lifts.length === 0) {
    throw configError(muscle, '"lifts" must be a non-empty array');
  }

  for (const lift of lifts) {
    if (!lift || typeof lift.key !== "string" || lift.key === "") {
      throw configError(muscle, "every lift needs a non-empty string key");
    }
    if (!Object.hasOwn(FORMULAS, lift.formula)) {
      throw configError(
        muscle,
        `lift "${lift.key}" names unknown formula "${lift.formula}"; known formulas are ` +
          `${quote(Object.keys(FORMULAS))}`
      );
    }
    // Positive for the same reason the multiplier is: a zero or negative factor
    // would make a heavier lift score the same or lower.
    if (typeof lift.factor !== "number" || !Number.isFinite(lift.factor) || lift.factor <= 0) {
      throw configError(
        muscle,
        `lift "${lift.key}" needs a positive finite factor, got ${lift.factor}`
      );
    }

    const unknownLiftKeys = Object.keys(lift).filter((key) => !LIFT_KEYS.has(key));
    if (unknownLiftKeys.length > 0) {
      throw configError(
        muscle,
        `lift "${lift.key}" sets unknown key(s) ${quote(unknownLiftKeys)}; a lift may only set ` +
          `${quote([...LIFT_KEYS])}`
      );
    }

    validateBounds(muscle, lift);
  }

  const duplicateLifts = duplicates(lifts.map((lift) => lift.key));
  if (duplicateLifts.length > 0) {
    throw configError(muscle, `lift key(s) ${quote(duplicateLifts)} appear more than once`);
  }

  if (!Array.isArray(tierOrder) || tierOrder.length === 0) {
    throw configError(muscle, '"tierOrder" must be a non-empty array');
  }

  const duplicateTiers = duplicates(tierOrder);
  if (duplicateTiers.length > 0) {
    throw configError(muscle, `tier(s) ${quote(duplicateTiers)} are duplicated in tierOrder`);
  }

  if (!Array.isArray(ladder) || ladder.length === 0) {
    throw configError(muscle, '"ladder" must be a non-empty array');
  }

  const duplicateLadder = duplicates(ladder);
  if (duplicateLadder.length > 0) {
    throw configError(muscle, `tier(s) ${quote(duplicateLadder)} are duplicated in the ladder`);
  }

  const rankOf = new Map(tierOrder.map((tier, index) => [tier, index]));

  const unknownLadder = ladder.filter((tier) => !rankOf.has(tier));
  if (unknownLadder.length > 0) {
    throw configError(muscle, `ladder tier(s) ${quote(unknownLadder)} are missing from tierOrder`);
  }

  for (let i = 1; i < ladder.length; i += 1) {
    if (rankOf.get(ladder[i]) <= rankOf.get(ladder[i - 1])) {
      throw configError(
        muscle,
        `ladder tier "${ladder[i]}" comes before "${ladder[i - 1]}" in tierOrder; the ladder ` +
          "must follow tierOrder"
      );
    }
  }

  for (const [label, tier] of [
    ["zeroTier", zeroTier],
    ["floorTier", floorTier],
  ]) {
    if (!rankOf.has(tier)) {
      throw configError(muscle, `${label} "${tier}" is missing from tierOrder`);
    }
  }

  // Every named tier has to be reachable, or it is a typo dressed up as a
  // feature. Since the override was deleted there are only two ways out of
  // rank(): the zero tier and the ladder.
  const reachable = new Set([...ladder, zeroTier]);
  const unreachable = tierOrder.filter((tier) => !reachable.has(tier));
  if (unreachable.length > 0) {
    throw configError(
      muscle,
      `tier(s) ${quote(unreachable)} can never be returned: not in the ladder and not the ` +
        "zero tier"
    );
  }

  if (!anchors || typeof anchors !== "object") {
    throw configError(muscle, '"anchors" must be an object');
  }

  const liftKeys = new Set(lifts.map((lift) => lift.key));
  for (const tier of ladder) {
    const anchor = anchors[tier];
    if (!anchor || typeof anchor !== "object") {
      throw configError(muscle, `ladder tier "${tier}" has no anchor lifts`);
    }
    const unknownAnchorKeys = Object.keys(anchor).filter((key) => !liftKeys.has(key));
    if (unknownAnchorKeys.length > 0) {
      throw configError(
        muscle,
        `anchor for tier "${tier}" uses unknown lift key(s) ${quote(unknownAnchorKeys)}; this ` +
          `muscle scores ${quote([...liftKeys])}`
      );
    }
  }
}

// Every tier is now in the ladder, so this check covers all of them — including
// Primordial, which used to sit outside it and hide the fact that chest's
// Primordial anchor scored 1703.4, below Immortal's 2253.2. With the approved
// anchor (2491.6) both muscles pass, and if anyone lowers it again the server
// refuses to start instead of misranking a user.
//
// The comparison is on the ROUNDED thresholds, because rank() classifies a
// rounded score: two anchors 0.3 apart would be strictly increasing as doubles
// and identical as integers, which would make one of the tiers unreachable.
function assertStrictlyIncreasing(muscle, thresholds) {
  for (let i = 1; i < thresholds.length; i += 1) {
    const previous = thresholds[i - 1];
    const current = thresholds[i];
    if (!(current.min > previous.min)) {
      throw configError(
        muscle,
        `ladder anchor scores must strictly increase after rounding, but "${current.tier}" ` +
          `scores ${current.min} and "${previous.tier}" scores ${previous.min}`
      );
    }
  }
}

/**
 * Highest tier whose threshold the score clears, or floorTier if it clears none.
 *
 * `thresholds` must be sorted ascending by `min` — createRankingEngine
 * guarantees that, and validation is what makes the guarantee safe to rely on.
 * Uses `min <= score`, matching the original engines' `score >= anchorScore`.
 * Exported on its own so the search can be tested against a linear scan.
 */
export function findTier(thresholds, score, floorTier) {
  let low = 0;
  let high = thresholds.length - 1;
  let best = floorTier;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (thresholds[mid].min <= score) {
      best = thresholds[mid].tier;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}

export function createRankingEngine(config) {
  validateConfig(config);

  const { muscle, multiplier, zeroTier, floorTier } = config;

  // Resolved once so rank() never does a lookup by name.
  const terms = config.lifts.map((lift) => ({
    key: lift.key,
    compute: FORMULAS[lift.formula],
    factor: lift.factor,
  }));

  function score(lifts) {
    let total = 0;

    // Iterated in config order, not in the caller's key order: floating-point
    // addition is not associative, so the sum has to be built in the same
    // sequence the original engines used.
    for (const term of terms) {
      const entry = lifts[term.key];
      if (!entry) continue;
      const { weight, reps } = entry;
      total += term.compute(weight, reps) * term.factor;
    }

    return total * multiplier;
  }

  // The work that used to happen 10 times per request now happens once per
  // process. Ladder order is tierOrder order, and the scores are asserted
  // increasing along it, so this array is already sorted ascending by min.
  //
  // Rounded here, once, for the same reason rank() rounds once: a threshold has
  // to be comparable to the integer that actually gets stored. Anything else
  // means a score can be saved under one tier and re-derive another.
  const thresholds = config.ladder.map((tier) =>
    Object.freeze({ tier, min: Math.round(score(config.anchors[tier])) })
  );
  assertStrictlyIncreasing(muscle, thresholds);
  Object.freeze(thresholds);

  function rank(lifts) {
    // Rounded before anything is decided, so the tier below and the score
    // returned cannot disagree. The database column is an integer, so this
    // rounding was always happening — it just used to happen in the controller,
    // after the tier had already been chosen from the unrounded value.
    const total = Math.round(score(lifts));

    // Kept ahead of everything else, as in the original: a non-positive or NaN
    // score returns a hard 0, not the computed value. Unreachable through the
    // API now that every lift must be at least 1 lb for 1 rep, so this is the
    // answer for a direct engine call only.
    if (!total || total <= 0) {
      return { muscle, tier: zeroTier, score: 0 };
    }

    return { muscle, tier: findTier(thresholds, total, floorTier), score: total };
  }

  return {
    muscle,
    rank,
    score,
    thresholds,
    /** Check submitted lifts against this muscle's own configured bounds. */
    validate: (lifts) => validateLifts(config, lifts),
  };
}
