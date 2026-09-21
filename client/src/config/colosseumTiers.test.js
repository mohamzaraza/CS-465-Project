import { describe, it, expect } from "vitest";
import colosseumTiers from "./colosseumTiers";

// Mirrors the StrengthTier enum in server/prisma/schema.prisma. The server
// sends these in upper case and LeaderboardRow capitalizes them for lookup.
const SERVER_TIERS = [
  "UNTRAINED",
  "RECRUIT",
  "NOVICE",
  "WARRIOR",
  "HEROIC",
  "CHAMPION",
  "TITAN",
  "OLYMPIAN",
  "DIVINE",
  "CELESTIAL",
  "IMMORTAL",
  "PRIMORDIAL",
];

describe("colosseumTiers", () => {
  it.each(SERVER_TIERS)("has a style entry for %s", (tier) => {
    const key = tier.charAt(0) + tier.slice(1).toLowerCase();
    expect(colosseumTiers[key]).toBeDefined();
  });
});
