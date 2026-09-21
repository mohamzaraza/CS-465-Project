import { useState, useEffect } from "react";
import { apiRequest } from "../../lib/api";

export default function RankChestPanel() {
  const [bench, setBench] = useState({ weight: "", reps: "" });
  const [incline, setIncline] = useState({ weight: "", reps: "" });
  const [cable, setCable] = useState({ weight: "", reps: "" });

  const [currentRank, setCurrentRank] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch saved chest rank on load
  useEffect(() => {
    apiRequest("/rank/chest/me")
      .then(setCurrentRank)
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest("/rank/chest", "POST", {
        lifts: {
          bench: {
            weight: Number(bench.weight),
            reps: Number(bench.reps),
          },
          incline_db: {
            weight: Number(incline.weight),
            reps: Number(incline.reps),
          },
          cable: {
            weight: Number(cable.weight),
            reps: Number(cable.reps),
          },
        },
      });

      setCurrentRank(data); // 🔴 CRITICAL: sync UI with DB result
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-black/40 border border-red-700/40 rounded-xl p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-display text-red-500 mb-4">
        Chest Trial
      </h2>

      {/* CURRENT DB-BACKED RANK */}
      {currentRank && (
        <div className="mb-6 p-4 border border-olympus-gold/40 rounded">
          <p className="text-sm text-gray-400">Current Chest Rank</p>
          <p className="text-xl font-display text-olympus-gold">
            {currentRank.tier}
          </p>
          <p className="text-gray-400">
            Score: {Math.round(currentRank.score)}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bench */}
        <div>
          <p className="text-sm text-gray-400 mb-1">Bench Press</p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Weight"
              value={bench.weight}
              onChange={(e) =>
                setBench({ ...bench, weight: e.target.value })
              }
              className="w-full p-2 bg-black border border-gray-700 rounded"
            />
            <input
              type="number"
              placeholder="Reps"
              value={bench.reps}
              onChange={(e) =>
                setBench({ ...bench, reps: e.target.value })
              }
              className="w-full p-2 bg-black border border-gray-700 rounded"
            />
          </div>
        </div>

        {/* Incline */}
        <div>
          <p className="text-sm text-gray-400 mb-1">Incline DB Press</p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Weight"
              value={incline.weight}
              onChange={(e) =>
                setIncline({ ...incline, weight: e.target.value })
              }
              className="w-full p-2 bg-black border border-gray-700 rounded"
            />
            <input
              type="number"
              placeholder="Reps"
              value={incline.reps}
              onChange={(e) =>
                setIncline({ ...incline, reps: e.target.value })
              }
              className="w-full p-2 bg-black border border-gray-700 rounded"
            />
          </div>
        </div>

        {/* Cable */}
        <div>
          <p className="text-sm text-gray-400 mb-1">Cable Fly</p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Weight"
              value={cable.weight}
              onChange={(e) =>
                setCable({ ...cable, weight: e.target.value })
              }
              className="w-full p-2 bg-black border border-gray-700 rounded"
            />
            <input
              type="number"
              placeholder="Reps"
              value={cable.reps}
              onChange={(e) =>
                setCable({ ...cable, reps: e.target.value })
              }
              className="w-full p-2 bg-black border border-gray-700 rounded"
            />
          </div>
        </div>

        <button
          disabled={loading}
          className="w-full mt-4 py-3 bg-red-600 text-black font-display rounded hover:scale-105 transition disabled:opacity-50"
        >
          {loading ? "Judging..." : "Rank Me"}
        </button>
      </form>

      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
}
