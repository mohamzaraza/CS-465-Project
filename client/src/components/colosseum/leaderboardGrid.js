// Header and rows must share one column template or the columns drift apart.
// Rank, tier, score, stars: rows carry no user field, so the flexible column
// that held the email is now the tier, keeping the row full width.
export const LEADERBOARD_GRID =
  "grid grid-cols-[80px_1fr_120px_100px] items-center";
