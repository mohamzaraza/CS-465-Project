import tierStyles from "../../config/colosseumTiers";
import { LEADERBOARD_GRID } from "./leaderboardGrid";


export default function LeaderboardRow({ row }) {
  // Normalize enum → display key
  const tierKey =
    row.tier?.charAt(0) +
    row.tier?.slice(1).toLowerCase();

  const tierStyle = tierStyles[tierKey];

  // Absolute safety fallback (NEVER crash leaderboard)
  if (!tierStyle) {
    console.warn("Unknown tier received:", row.tier);
    return (
      <div className="flex justify-between px-4 py-2 text-gray-500">
        <span>#{row.rank}</span>
        <span>{row.user}</span>
        <span>Unknown</span>
        <span>{row.score}</span>
      </div>
    );
  }

  return (
    <div className={`${LEADERBOARD_GRID} px-4 py-3 rounded-lg`}>
      <span className="text-gray-400">#{row.rank}</span>

      <span className="font-medium truncate">
        {row.user}
      </span>

      <span className="text-center font-display">
        {tierKey}
      </span>

      <span className="text-right text-gray-300">
        {row.score}
      </span>

      {/* Stars will come from mastery, which the leaderboard does not send
          yet; the empty cell keeps the grid aligned with the header. */}
      <div className="flex justify-end gap-1" />
    </div>
  );
}
