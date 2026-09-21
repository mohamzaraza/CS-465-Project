import LeaderboardRow from "./LeaderboardRow";
import { LEADERBOARD_GRID } from "./leaderboardGrid";

  
export default function TotalLeaderboard({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 italic">
        No rankings yet. Be the first to enter the Colosseum.
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-red-800/40 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className={`${LEADERBOARD_GRID} px-4 py-2 mb-3 text-sm text-gray-400 uppercase tracking-wide`}>
      <span>Rank</span>
      <span>Warrior</span>
      <span className="text-center">Tier</span>
      <span className="text-right">Score</span>
      <span className="text-right">Stars</span>
    </div>

      {/* Rows */}
      <div className="space-y-2">
        {data.map((row) => (
          <LeaderboardRow key={row.rank} row={row} />
        ))}
      </div>
    </div>
  );
}
