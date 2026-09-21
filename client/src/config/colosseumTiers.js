const colosseumTiers = {
  /* ============================================================
      0. UNTRAINED — "Not yet in the arena"
     ============================================================ */
  Untrained: {
    plateType: "solid",
    plate: "#1b1b1b", // dull charcoal
    border: "#2d2d2d",
    glow: "rgba(80,80,80,0.15)",
    text: "#8c8c8c",
  },

  /* ============================================================
      1. RECRUIT — raw iron, entered the arena but unproven
     ============================================================ */
  Recruit: {
    plateType: "gradient",
    gradient: "linear-gradient(135deg, #2a2a2a, #4a4a4a)", // dark → forged iron
    border: "#6e6e6e",
    glow: "rgba(140,140,140,0.3)",
    text: "#c4c4c4",
  },

  /* ============================================================
      2. NOVICE — copper tone, first true metal
     ============================================================ */
  Novice: {
    plateType: "gradient",
    gradient: "linear-gradient(135deg, #4b2e16, #7a4a20)", // dark → warm copper
    border: "#b87333",
    glow: "rgba(184,115,51,0.45)", // copper glow
    text: "#f2d3b2",
  },

  /* ============================================================
      3. WARRIOR — gold accents, first honorable metal
     ============================================================ */
  Warrior: {
    plateType: "gradient",
    gradient: "linear-gradient(135deg, #3a3a1e, #6c5f1b)", // tarnished gold
    border: "#c8a24a",
    glow: "rgba(255,220,150,0.45)",
    text: "#ffe8ad",
  },

  /* ============================================================
      4. HEROIC — bold, reddish bronze, “battle-tested”
     ============================================================ */
  Heroic: {
    plateType: "gradient",
    gradient: "linear-gradient(135deg, #4a1f1f, #7a3636)", // dark → hero red metal
    border: "#d46a4a",
    glow: "rgba(255,120,120,0.45)",
    text: "#ffd1c2",
  },

  /* ============================================================
      5. CHAMPION — high sheen silver-gold alloy
     ============================================================ */
  Champion: {
    plateType: "gradient",
    gradient: "linear-gradient(135deg, #9e9e9e, #d8d8d8)",
    border: "#ffffff",
    glow: "rgba(255,255,255,0.65)", // bright neutral glow
    text: "#ffffff",
  },

  /* ============================================================
      6. TITAN — darker, heavier, ancient metal
     ============================================================ */
  Titan: {
    plateType: "gradient",
    gradient: "linear-gradient(135deg, #4d341e, #291d12)", // deep volcanic bronze
    border: "#b68752",
    glow: "rgba(255,180,90,0.55)",
    text: "#ffe2c1",
  },

  /* ============================================================
      7. OLYMPIAN — bright divine gold + sky aura
     ============================================================ */
  Olympian: {
    plateType: "gradient",
    gradient: "linear-gradient(135deg, #d4af37, #8c6d1f)", // olympic gold
    border: "#f6d97a",
    glow: "rgba(120,180,255,0.9)", // light blue divine aura
    text: "#fff4c2",
  },

  /* ============================================================
      8. DIVINE — platinum with holy radiance
     ============================================================ */
  Divine: {
    plateType: "gradient",
    gradient: "linear-gradient(135deg, #e3e3e3, #bfbfbf)",
    border: "#ffffff",
    glow: "rgba(200,230,255,0.9)", // cold holy glow
    text: "#f5faff",
  },

  /* ============================================================
      9. CELESTIAL — bright cosmic blue + emerald tint
     ============================================================ */
  Celestial: {
    plateType: "gradient",
    gradient: "linear-gradient(135deg, #7dd3fc, #34d399)", // sky blue → soft emerald
    border: "#b3f0ff",
    glow: "rgba(160,255,255,1)", // intense celestial aura
    text: "#e8faff",
  },

  /* ============================================================
      10. IMMORTAL — red/black god-tier with violent aura
     ============================================================ */
  Immortal: {
    plateType: "gradient",
    gradient: "linear-gradient(135deg, #1a0000, #4d0a0a)", // deep blood red → dark void
    border: "#ff4d4d",
    glow: "rgba(255,50,50,0.95)", // strong red aura
    text: "#ffd6d6",
  },

  /* ============================================================
      11. PRIMORDIAL — hidden tier, forbidden color
     ============================================================ */
  Primordial: {
    plateType: "gradient",
    gradient: "linear-gradient(135deg, #1b0033, #000000)", // void purple → abyss
    border: "#b46cff",
    glow: "rgba(190,80,255,1)", // violent cosmic purple
    text: "#f1d6ff",
  },
};

export default colosseumTiers;
