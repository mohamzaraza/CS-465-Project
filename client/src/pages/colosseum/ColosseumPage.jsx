import { useCallback, useEffect, useState } from "react";
import TotalLeaderboard from "../../components/colosseum/TotalLeaderboard";
import RankChestPanel from "../../components/colosseum/RankChestPanel";
import { apiRequest } from "../../lib/api";

export default function ColosseumPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState(null);

  const loadLeaderboard = useCallback(() => {
    apiRequest("/leaderboard/chest")
      .then((data) => {
        setLeaderboard(data);
      })
      .catch((err) => {
        // Without a visible error, a failed request looks exactly like an
        // empty leaderboard ("No rankings yet").
        console.error(err);
        setError(err);
      });
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  function handleRetry() {
    setError(null);
    loadLeaderboard();
  }

  return (
    <div className="min-h-screen bg-[#111] text-white pt-32 pb-20 px-6">

      <h1 className="text-5xl font-display text-red-600 text-center mb-12">
        THE COLOSSEUM
      </h1>

      {/* Leaderboard */}
      <div className="max-w-5xl mx-auto mb-20">
        {error ? (
          <div className="bg-black/40 border border-red-800/40 rounded-2xl p-6 text-center">
            <p role="alert" className="text-red-400 mb-4">{error.message}</p>
            <button
              onClick={handleRetry}
              className="px-6 py-2 bg-red-600 text-black font-display rounded hover:scale-105 transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <TotalLeaderboard data={leaderboard} />
        )}
      </div>

      {/* Ranking Panel */}
      <div className="max-w-4xl mx-auto">
        <RankChestPanel />
      </div>

    </div>
  );
}
