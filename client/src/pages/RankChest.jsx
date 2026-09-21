import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

export default function RankChestPanel() {
  // Lift inputs
  const [bench, setBench] = useState({ weight: "", reps: "" });
  const [incline, setIncline] = useState({ weight: "", reps: "" });
  const [cable, setCable] = useState({ weight: "", reps: "" });

  // UI state
  const [currentRank, setCurrentRank] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch existing chest rank
  useEffect(() => {
    apiRequest("/rank/chest/me")
      .then(setCurrentRank)
      .catch(() => {
        // User may not be ranked yet — silent fail is correct
      });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
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
      };
      const data = await apiRequest("/rank/chest", { method: "POST", body: payload });

      setResult(data);
      setCurrentRank(data); // update displayed rank immediately
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

      {/* CURRENT RANK */}
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

      {/* FORM */}
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
              required
            />
            <input
              type="number"
              placeholder="Reps"
              value={bench.reps}
              onChange={(e) =>
                setBench({ ...bench, reps: e.target.value })
              }
              className="w-full p-2 bg-black border border-gray-700 rounded"
              required
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
              required
            />
            <input
              type="number"
              placeholder="Reps"
              value={incline.reps}
              onChange={(e) =>
                setIncline({ ...incline, reps: e.target.value })
              }
              className="w-full p-2 bg-black border border-gray-700 rounded"
              required
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
              required
            />
            <input
              type="number"
              placeholder="Reps"
              value={cable.reps}
              onChange={(e) =>
                setCable({ ...cable, reps: e.target.value })
              }
              className="w-full p-2 bg-black border border-gray-700 rounded"
              required
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

      {/* ERROR */}
      {error && (
        <p className="text-red-400 mt-4 text-sm">{error}</p>
      )}

      {/* RESULT */}
      {result && (
        <div className="mt-6 border-t border-gray-700 pt-4">
          <p className="text-lg">
            New Tier:{" "}
            <span className="text-olympus-gold font-display">
              {result.tier}
            </span>
          </p>
          <p className="text-gray-400">
            Score: {Math.round(result.score)}
          </p>
        </div>
      )}
    </div>
  );
}
