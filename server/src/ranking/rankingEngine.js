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
// What deliberately did NOT change: the arithmetic, its order, and every
// documented defect. server/tests/fixtures/ranking-golden.json pins all of it.

import { FORMULAS } from "./formulas.js";

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

function validateConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("ranking config: expected an object");
  }

  const { muscle, multiplier, lifts, tierOrder, ladder, anchors, zeroTier, floorTier, override } =
    config;

  if (typeof muscle !== "string" || muscle === "") {
    throw new Error('ranking config: "muscle" must be a non-empty string');
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
    if (typeof lift.factor !== "number" || !Number.isFinite(lift.factor)) {
      throw configError(muscle, `lift "${lift.key}" needs a finite factor, got ${lift.factor}`);
    }
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

  if (override !== undefined) {
    if (!rankOf.has(override.tier)) {
      throw configError(muscle, `override tier "${override.tier}" is missing from tierOrder`);
    }
    if (!Object.hasOwn(FORMULAS, override.formula)) {
      throw configError(
        muscle,
        `override names unknown formula "${override.formula}"; known formulas are ` +
          `${quote(Object.keys(FORMULAS))}`
      );
    }
    if (!lifts.some((lift) => lift.key === override.lift)) {
      throw configError(muscle, `override reads unknown lift "${override.lift}"`);
    }
    if (typeof override.min !== "number" || !Number.isFinite(override.min)) {
      throw configError(muscle, `override needs a finite min, got ${override.min}`);
    }
  }

  // Every named tier has to be reachable, or it is a typo dressed up as a
  // feature. The three ways out of rank() are the zero tier, the ladder, and
  // the override tier.
  const reachable = new Set([...ladder, zeroTier, override?.tier]);
  const unreachable = tierOrder.filter((tier) => !reachable.has(tier));
  if (unreachable.length > 0) {
    throw configError(
      muscle,
      `tier(s) ${quote(unreachable)} can never be returned: not in the ladder, not the zero ` +
        "tier, and not the override tier"
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
    const unknownKeys = Object.keys(anchor).filter((key) => !liftKeys.has(key));
    if (unknownKeys.length > 0) {
      throw configError(
        muscle,
        `anchor for tier "${tier}" uses unknown lift key(s) ${quote(unknownKeys)}; this muscle ` +
          `scores ${quote([...liftKeys])}`
      );
    }
  }
}

// The ladder deliberately excludes the override tier, so an override anchor that
// scores out of order cannot trip this. That is not a loophole, it is the point:
// chest's Primordial anchor scores 1703.4, below Immortal's 2253.2, and it is
// dead data because Primordial is reached by a 1RM check rather than by score.
// Were it in the ladder, this check would (correctly) refuse to start.
function assertStrictlyIncreasing(muscle, thresholds) {
  for (let i = 1; i < thresholds.length; i += 1) {
    const previous = thresholds[i - 1];
    const current = thresholds[i];
    if (!(current.min > previous.min)) {
      throw configError(
        muscle,
        `ladder anchor scores must strictly increase, but "${current.tier}" scores ` +
          `${current.min} and "${previous.tier}" scores ${previous.min}`
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

  const { muscle, multiplier, zeroTier, floorTier, override } = config;

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
  const thresholds = config.ladder.map((tier) =>
    Object.freeze({ tier, min: score(config.anchors[tier]) })
  );
  assertStrictlyIncreasing(muscle, thresholds);
  Object.freeze(thresholds);

  const overrideRule = override
    ? { ...override, compute: FORMULAS[override.formula] }
    : null;

  function rank(lifts) {
    const total = score(lifts);

    // Kept ahead of everything else, as in the original: a non-positive or NaN
    // score returns a hard 0, not the computed value.
    if (!total || total <= 0) {
      return { muscle, tier: zeroTier, score: 0 };
    }

    const tier = findTier(thresholds, total, floorTier);

    // Checked after the ladder, matching the original order. The override reads
    // the lift's UNFACTORED formula result, which is why back's 0.45 deadlift
    // factor does not apply here.
    if (overrideRule) {
      const entry = lifts[overrideRule.lift];
      if (entry && overrideRule.compute(entry.weight, entry.reps) >= overrideRule.min) {
        return { muscle, tier: overrideRule.tier, score: total };
      }
    }

    return { muscle, tier, score: total };
  }

  return { muscle, rank, score, thresholds };
}
