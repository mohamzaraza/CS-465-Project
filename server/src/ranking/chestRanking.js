// chestRanking.js
//---------------------------------------------------------
// FINAL, CLEANED, ACCURATE CHEST RANKING ENGINE
//---------------------------------------------------------

import {
  CHEST_MULTIPLIER,
  CHEST_TIERS_IN_ORDER,
  CHEST_TIER_ANCHORS,
} from "./chestTierAnchors.js";

// 1RM formula used ONLY for bench
function epley1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
}

// ---------------------------------------------------------
// MAIN CHEST SCORING FUNCTION
// ---------------------------------------------------------
export function computeChestScore(lifts) {
  let total = 0;

  // A-LIFT — Bench (highest strength signal)
  if (lifts.bench) {
    const { weight, reps } = lifts.bench;
    total += epley1RM(weight, reps);
  }

  // B-LIFT — Incline DB (slightly inflated multiplier)
  if (lifts.incline_db) {
    const { weight, reps } = lifts.incline_db;
    total += weight * reps * 1.1;
  }

  // C-LIFT — Cable Flyes (hypertrophy accessory)
  if (lifts.cable) {
    const { weight, reps } = lifts.cable;
    total += weight * reps * 0.9;
  }

  return total * CHEST_MULTIPLIER;
}

// ---------------------------------------------------------
// Anchor scoring for each tier
// ---------------------------------------------------------
function computeChestAnchorScore(tierName) {
  const anchor = CHEST_TIER_ANCHORS[tierName];
  if (!anchor) return 0;
  return computeChestScore(anchor);
}

// ---------------------------------------------------------
// Compute tier: compares score against tier anchors
// ---------------------------------------------------------
export function computeChestTier(userLifts) {
  const score = computeChestScore(userLifts);

  if (!score || score <= 0) {
    return { muscle: "chest", tier: "Untrained", score: 0 };
  }

  let bestTier = "Recruit";
  let bestAnchor = 0;

  for (const tier of CHEST_TIERS_IN_ORDER) {
    if (tier === "Untrained") continue;
    if (tier === "Primordial") continue; // handled separately

    const anchorScore = computeChestAnchorScore(tier);

    if (score >= anchorScore && anchorScore >= bestAnchor) {
      bestTier = tier;
      bestAnchor = anchorScore;
    }
  }

  // Special: Primordial override if bench 1RM is insane
  if (userLifts.bench) {
    const bench1RM = epley1RM(
      userLifts.bench.weight,
      userLifts.bench.reps
    );

    if (bench1RM >= 415) {
      return { muscle: "chest", tier: "Primordial", score };
    }
  }

  return { muscle: "chest", tier: bestTier, score };
}
