// The only module anything outside server/src/ranking should import.
//
// Engines are built HERE, at import time, from the config. That is deliberate:
// createRankingEngine validates the config and throws, so a bad ladder takes
// the server down on startup instead of quietly misranking a user hours later.
//
// The computeXTier / computeXScore names are the ones the rest of the server and
// the golden-master scripts already use, so they stay as thin wrappers. New code
// should prefer rankLifts(muscle, lifts).

import { BACK_CONFIG, CHEST_CONFIG, RANKING_CONFIGS } from "./rankingConfig.js";
import { createRankingEngine } from "./rankingEngine.js";

const engines = new Map(
  RANKING_CONFIGS.map((config) => [config.muscle, createRankingEngine(config)])
);

export function getRankingEngine(muscle) {
  const engine = engines.get(muscle);
  if (!engine) {
    throw new Error(
      `no ranking engine for muscle "${muscle}"; configured muscles are ` +
        `${[...engines.keys()].map((name) => `"${name}"`).join(", ")}`
    );
  }
  return engine;
}

/**
 * Rank one muscle's lifts. Throws for a muscle with no configured engine.
 *
 * Assumes the lifts already passed validateLifts: rank() is a pure scorer and
 * will happily score nonsense, which is why every caller validates first.
 */
export function rankLifts(muscle, lifts) {
  return getRankingEngine(muscle).rank(lifts);
}

/**
 * Check one muscle's submitted lifts against its configured bounds.
 * Returns { ok: true, lifts } or { ok: false, errors }; never throws for bad
 * input, only for a muscle with no configured engine.
 */
export function validateLifts(muscle, lifts) {
  return getRankingEngine(muscle).validate(lifts);
}

const chest = getRankingEngine("chest");
const back = getRankingEngine("back");

export function computeChestScore(lifts) {
  return chest.score(lifts);
}

export function computeChestTier(lifts) {
  return chest.rank(lifts);
}

export function computeBackScore(lifts) {
  return back.score(lifts);
}

export function computeBackTier(lifts) {
  return back.rank(lifts);
}

// Re-exported under their old names for the golden-master scripts and the
// characterization test, which read the raw config data to build their cases.
export const CHEST_MULTIPLIER = CHEST_CONFIG.multiplier;
export const BACK_MULTIPLIER = BACK_CONFIG.multiplier;
export const CHEST_TIERS_IN_ORDER = CHEST_CONFIG.tierOrder;
export const BACK_TIERS_IN_ORDER = BACK_CONFIG.tierOrder;
export const CHEST_TIER_ANCHORS = CHEST_CONFIG.anchors;
export const BACK_TIER_ANCHORS = BACK_CONFIG.anchors;
