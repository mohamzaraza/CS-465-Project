// server/src/ranking/backRanking.js
import {
  BACK_MULTIPLIER,
  BACK_TIERS_IN_ORDER,
  BACK_TIER_ANCHORS,
} from "./backTierAnchors.js";

// Epley formula for 1RM (used only for deadlift here)
function epley1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
}

// Hybrid back scoring
export function computeBackScore(lifts) {
  let total = 0;

  // A — Lat Pulldown (big hypertrophy / strength driver)
  if (lifts.lat_pulldown) {
    const { weight, reps } = lifts.lat_pulldown;
    const lpScore = weight * reps * 1.6;
    total += lpScore;
  }

  // B — DB Row (thickness / mid-back)
  if (lifts.db_row) {
    const { weight, reps } = lifts.db_row;
    const rowScore = weight * reps * 1.2;
    total += rowScore;
  }

  // C — Deadlift (full posterior, but not purely "back")
  if (lifts.deadlift) {
    const { weight, reps } = lifts.deadlift;
    const dl1RM = epley1RM(weight, reps);
    const dlScore = dl1RM * 0.45;
    total += dlScore;
  }

  return total * BACK_MULTIPLIER;
}

// Anchor score for a specific tier
function computeBackAnchorScore(tierName) {
  const anchor = BACK_TIER_ANCHORS[tierName];
  if (!anchor) return 0;
  return computeBackScore(anchor);
}

// Main: given user lifts, compute score + tier
export function computeBackTier(userLifts) {
  const score = computeBackScore(userLifts);

  if (!score || score <= 0) {
    return {
      muscle: "back",
      tier: "Untrained",
      score: 0,
    };
  }

  let bestTier = "Recruit";
  let bestAnchor = 0;

  for (const tier of BACK_TIERS_IN_ORDER) {
    if (tier === "Untrained") continue;
    if (tier === "Primordial") continue; // handled separately

    const anchorScore = computeBackAnchorScore(tier);
    if (score >= anchorScore && anchorScore >= bestAnchor) {
      bestTier = tier;
      bestAnchor = anchorScore;
    }
  }

  // Special case: Primordial — insane deadlift 1RM
  const dl = userLifts.deadlift;
  if (dl) {
    const dl1RM = epley1RM(dl.weight, dl.reps);
    if (dl1RM >= 600) {
      return {
        muscle: "back",
        tier: "Primordial",
        score,
      };
    }
  }

  return {
    muscle: "back",
    tier: bestTier,
    score,
  };
}
