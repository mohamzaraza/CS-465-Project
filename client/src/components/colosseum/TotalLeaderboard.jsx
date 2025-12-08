import { useState } from "react";

// Mock sample data — replace with real data later
const leaderboardData = [
  {
    name: "Emiliano C.",
    tier: "Olympian",
    mastery: "Full Mastery",
    score: 1335,
    details: {
      squat: "475 lb",
      bench: "355 lb",
      deadlift: "505 lb",
    },
  },
  {
    name: "ChatGPT",
    tier: "Immortal",
    mastery: "Ascended",
    score: 1290,
    details: {
      squat: "455 lb",
      bench: "325 lb",
      deadlift: "510 lb",
    },
  },
  {
    name: "Riven D.",
    tier: "Warrior",
    mastery: "Adept",
    score: 1105,
    details: {
      squat: "405 lb",
      bench: "275 lb",
      deadlift: "425 lb",
    },
  },
];

// Tier colors (simplified for now — can expand later)
const tierColors = {
  Olympian: "text-yellow-400",
  Immortal: "text-purple-400",
  Warrior: "text-red-400",
  Adept: "text-blue-400",
};

export default function TotalLeaderboard() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="bg-black/40 border border-red-600/40 p-6 rounded-2xl shadow-2xl backdrop-blur-md">
      <h2 className="text-4xl font-display text-red-500 mb-6 text-center drop-shadow-[0_0_25px_rgba(255,0,0,0.4)]">
        LiftLogic Total Strength Leaderboard
      </h2>

      <div className="space-y-4">
        {leaderboardData.map((user, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={index}
              className="bg-black/30 rounded-xl border border-gray-700 hover:border-red-600 transition-all duration-200 cursor-pointer overflow-hidden"
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              {/* Row header */}
              <div className="flex justify-between items-center px-5 py-4">
                <div>
                  <p className="text-lg font-semibold text-gray-200">
                    {index + 1}. {user.name}
                  </p>

                  <p className={`text-sm ${tierColors[user.tier]}`}>
                    {user.tier} — {user.mastery}
                  </p>
                </div>

                <p className="text-red-400 font-bold text-xl drop-shadow-[0_0_10px_rgba(255,0,0,0.6)]">
                  {user.score} pts
                </p>
              </div>

              {/* Expandable details */}
              {isOpen && (
                <div className="bg-black/40 border-t border-gray-700 px-5 py-4 text-gray-300 space-y-2 animate-fadeIn">
                  <p>🛡 Squat: {user.details.squat}</p>
                  <p>⚔️ Bench Press: {user.details.bench}</p>
                  <p>🏹 Deadlift: {user.details.deadlift}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
