import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

function emptyValues(lifts) {
  return Object.fromEntries(lifts.map(({ key }) => [key, { weight: "", reps: "" }]));
}

// Returns the first problem as a user-facing message, or null when the
// values are safe to send. Checking here saves a round trip and, more
// importantly, a spent ranking attempt on the server's cooldown.
function validate(lifts, values) {
  for (const { key, label } of lifts) {
    const { weight, reps } = values[key];
    if (weight.trim() === "" || reps.trim() === "") {
      return `Enter weight and reps for ${label}.`;
    }
    const w = Number(weight);
    if (!Number.isFinite(w) || w <= 0) {
      return `Weight for ${label} must be above 0.`;
    }
    const r = Number(reps);
    if (!Number.isInteger(r) || r <= 0) {
      return `Reps for ${label} must be a whole number above 0.`;
    }
  }
  return null;
}

export default function LiftRankForm({
  muscle,
  lifts,
  onRanked,
  showResult = false,
  errorClassName = "text-red-400 mt-4",
}) {
  const muscleName = muscle.charAt(0).toUpperCase() + muscle.slice(1);

  const [values, setValues] = useState(() => emptyValues(lifts));
  const [currentRank, setCurrentRank] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest(`/rank/${muscle}/me`)
      .then(setCurrentRank)
      .catch(() => {
        // User may not be ranked yet — silent fail is correct
      });
  }, [muscle]);

  function updateValue(key, field, value) {
    setValues((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const problem = validate(lifts, values);
    if (problem) {
      setError(problem);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        lifts: Object.fromEntries(
          lifts.map(({ key }) => [
            key,
            { weight: Number(values[key].weight), reps: Number(values[key].reps) },
          ])
        ),
      };
      const data = await apiRequest(`/rank/${muscle}`, { method: "POST", body: payload });

      setResult(data);
      setCurrentRank(data); // update displayed rank immediately
      onRanked?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-black/40 border border-red-700/40 rounded-xl p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-display text-red-500 mb-4">
        {muscleName} Trial
      </h2>

      {/* CURRENT RANK */}
      {currentRank && (
        <div className="mb-6 p-4 border border-olympus-gold/40 rounded">
          <p className="text-sm text-gray-400">Current {muscleName} Rank</p>
          <p className="text-xl font-display text-olympus-gold">
            {currentRank.tier}
          </p>
          <p className="text-gray-400">
            Score: {Math.round(currentRank.score)}
          </p>
        </div>
      )}

      {/* noValidate: our own messages replace the browser's, so every
          invalid case is reported the same way */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {lifts.map(({ key, label }) => (
          <div key={key}>
            <p className="text-sm text-gray-400 mb-1">{label}</p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Weight"
                aria-label={`${label} weight`}
                value={values[key].weight}
                onChange={(e) => updateValue(key, "weight", e.target.value)}
                className="w-full p-2 bg-black border border-gray-700 rounded"
              />
              <input
                type="number"
                placeholder="Reps"
                aria-label={`${label} reps`}
                value={values[key].reps}
                onChange={(e) => updateValue(key, "reps", e.target.value)}
                className="w-full p-2 bg-black border border-gray-700 rounded"
              />
            </div>
          </div>
        ))}

        <button
          disabled={loading}
          className="w-full mt-4 py-3 bg-red-600 text-black font-display rounded hover:scale-105 transition disabled:opacity-50"
        >
          {loading ? "Judging..." : "Rank Me"}
        </button>
      </form>

      {/* ERROR */}
      {error && (
        <p role="alert" className={errorClassName}>{error}</p>
      )}

      {/* RESULT */}
      {showResult && result && (
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
