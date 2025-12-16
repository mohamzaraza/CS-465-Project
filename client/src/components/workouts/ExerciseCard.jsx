export default function ExerciseCard({ exercise }) {
  return (
    <div
      className="
        bg-black/40 backdrop-blur-md rounded-2xl
        border border-olympus-gold/30
        shadow-[0_0_20px_rgba(0,0,0,0.5)]
        overflow-hidden
      "
    >
      {/* Title bar */}
      <div className="px-5 pt-5">
        <h3 className="text-2xl font-display text-olympus-gold">
          {exercise.name}
        </h3>
        <p className="text-gray-400 text-sm mt-1">
          <span className="text-gray-300 font-semibold">Target:</span>{" "}
          {exercise.target || "—"}
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
        {/* LEFT: Video */}
        <div>
          <video
            controls
            muted
            playsInline
            preload="metadata"
            className="w-full rounded-xl border border-white/10"
          >
            <source src={exercise.video} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {exercise.setsReps && (
            <p className="text-xs text-gray-400 mt-2">
              <span className="text-gray-300 font-semibold">Suggested:</span>{" "}
              {exercise.setsReps}
            </p>
          )}
        </div>

        {/* RIGHT: Details */}
        <div className="space-y-4 text-sm">
          {/* Setup */}
          {exercise.setup?.length > 0 && (
            <div className="bg-black/30 rounded-xl border border-white/10 p-3">
              <p className="text-olympus-gold font-semibold mb-2">
                Setup
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                {exercise.setup.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Cues */}
          {exercise.cues?.length > 0 && (
            <div className="bg-black/30 rounded-xl border border-white/10 p-3">
              <p className="text-olympus-gold font-semibold mb-2">
                Form Cues
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                {exercise.cues.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Mistakes */}
          {exercise.mistakes?.length > 0 && (
            <div className="bg-black/30 rounded-xl border border-red-400/20 p-3">
              <p className="text-red-300 font-semibold mb-2">
                Common Mistakes
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                {exercise.mistakes.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
