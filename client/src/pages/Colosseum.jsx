import TotalLeaderboard from "../components/colosseum/TotalLeaderboard";

export default function Colosseum() {
  const isPremiumUser = false; // TEMP — replace later with real auth

  return (
    <div className="min-h-screen bg-[#111] text-white pt-32 pb-20 px-6">

      {/* ======================= HERO ======================= */}
      <div className="text-center mb-20">
        <h1 className="text-6xl font-display text-red-600 drop-shadow-[0_0_40px_rgba(255,40,40,0.6)]">
          THE COLOSSEUM
        </h1>

        <p className="text-gray-300 mt-4 max-w-3xl mx-auto text-lg leading-relaxed">
          Strength without measurement is illusion.  
          Here, your limits are exposed — and your rank is carved in stone.
        </p>
      </div>

      {/* ====================== EDUCATIONAL SECTIONS ====================== */}
      <section className="max-w-4xl mx-auto mb-20 space-y-12">

        <InfoBlock
          title="Why Rank?"
          content="Competition reveals the truth — your current level, your weaknesses, and the gap between who you are and who you claim to be. Ranking creates clarity, accountability, and direction."
        />

        <InfoBlock
          title="The LiftLogic Strength Index"
          content="Your future rank will be built using multi-lift scoring across the major movements: Squat, Bench, and Deadlift. Weight moved relative to bodyweight determines your true standing."
        />

        <InfoBlock
          title="How Ranking Works"
          content="The free version shows example boards. The Premium version calculates your actual numbers, assigns your tier, and places you among other lifters."
        />
      </section>

      {/* ==================== FREE LEADERBOARDS ==================== */}

      <div className="max-w-5xl mx-auto mt-20">
      <TotalLeaderboard />
      </div>


      {/* =================== GET RANKED BUTTON =================== */}
      <div className="text-center mb-24">
        <button className="px-12 py-4 mt-12 bg-red-600 text-black font-display text-xl rounded-xl hover:scale-105 transition-all shadow-[0_0_25px_rgba(255,0,0,0.5)]">
          Begin Your Ranking Trial
        </button>
      </div>

      {/* ===================== PREMIUM DOTS SECTION ===================== */}
      <section className="max-w-5xl mx-auto mb-20">
        <h2 className="text-center text-4xl font-display text-red-500 mb-10 drop-shadow-[0_0_25px_rgba(255,0,0,0.4)]">
          DOTS Powerlifting Leaderboards
        </h2>

        <div
          className={`
            p-10 rounded-2xl border border-red-800/40 bg-black/40 backdrop-blur-sm
            ${!isPremiumUser ? "blur-sm pointer-events-none select-none" : ""}
          `}
        >
          {/* STATIC DOTS (real world) */}
          <div className="mb-12">
            <h3 className="text-2xl text-red-400 font-display mb-4">
              Titans of Strength (Real Rankings)
            </h3>
            <div className="bg-black/30 border border-gray-700 p-6 rounded-xl">
              <p className="text-gray-500 italic">
                Top 30 world athletes will appear here.
              </p>
            </div>
          </div>

          {/* LIFTLOGIC DOTS */}
          <div>
            <h3 className="text-2xl text-red-400 font-display mb-4">
              LiftLogic DOTS Leaderboard
            </h3>
            <div className="bg-black/30 border border-gray-700 p-6 rounded-xl">
              <p className="text-gray-500 italic">
                Ranked LiftLogic users will appear here.
              </p>
            </div>
          </div>
        </div>

        {/* PREMIUM CTA */}
        {!isPremiumUser && (
          <div className="text-center mt-10">
            <p className="text-gray-400 mb-4">
              Unlock advanced scoring, DOTS ranking, and profile progression with
            </p>
            <button className="px-10 py-3 bg-red-600 text-black rounded-xl font-display hover:scale-105 transition-all">
              Upgrade to LiftLogic Plus
            </button>
          </div>
        )}
      </section>

    </div>
  );
}

/* ====================== COMPONENTS ====================== */

function InfoBlock({ title, content }) {
  return (
    <div>
      <h2 className="text-3xl font-display text-red-500 mb-3">{title}</h2>
      <p className="text-gray-300 leading-relaxed">{content}</p>
    </div>
  );
}

