// ===========================
// LiftLogic Tier Color System
// ===========================
//
// This file defines the aesthetic identity of each difficulty tier.
// Copper → Silver → Gold → Divine Logic (Black + Red Aura)
// Used across:
// - DifficultyNav buttons
// - DifficultyBanner
// - DifficultySection accents
// - Exercise cards (later)
//
// Update here once and the entire site updates automatically.

const tierColors = {
  newcomer: {
    // Muted copper, less orange, more bronze
    base: "#4F3A28",
    border: "#A67C52",
    text: "#E8DCC5",
    glow: "rgba(166,124,82,0.35)",
  },

  warrior: {
    // Softened silver — brighter text for readability
    base: "#3A3A3C",
    border: "#C0C0C0",
    text: "#F5F5F5",
    glow: "rgba(192,192,192,0.28)",
  },

  elite: {
    // Gold — with slightly more glow
    base: "#3A2E0F",
    border: "#D4AF37",
    text: "#FFF7D6",
    glow: "rgba(212,175,55,0.45)",
  },

  logiccrafted: {
    // Divine black + red — more dramatic
    base: "#0E0B10",
    border: "#8B0000",
    text: "#FFD6D6",
    glow: "rgba(255,0,0,0.45)",
  },
};

export default tierColors;