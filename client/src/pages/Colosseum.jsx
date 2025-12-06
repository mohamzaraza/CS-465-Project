export default function Colosseum() {
  return (
    <div className="min-h-screen bg-[#111] text-white pt-32 pb-20 px-6">

      {/* HERO */}
      <div className="text-center mb-16">
        <h1 className="text-6xl font-display text-red-600 drop-shadow-[0_0_35px_rgba(255,50,50,0.5)]">
          The Colosseum
        </h1>
        <p className="text-gray-300 mt-4 max-w-3xl mx-auto text-lg leading-relaxed">
          Strength without measurement is illusion.  
          Here, your numbers are tested. Your discipline is weighed.  
          And your rank is forged in comparison with others who walk the same path.
        </p>
      </div>

      {/* PHILOSOPHY */}
      <section className="max-w-4xl mx-auto mb-20 space-y-10">
        <ColosseumSection
          title="Why Rank?"
          content="Competition reveals the truth — your current level, your weaknesses, and the gap between who you are and who you claim to be. The Colosseum is not about ego. It is about clarity, progress, and accountability."
        />

        <ColosseumSection
          title="The LiftLogic Strength Index"
          content="You will eventually be ranked using a unified score based on your Squat, Bench, Deadlift, and bodyweight. A lightweight lifter outlifting his weight class will be rewarded. A heavyweight with true power will rise accordingly."
        />

        <ColosseumSection
          title="How Ranking Works"
          content="Scores scale with bodyweight, reps, intensity, and lift category. The free version shows example leaderboards. The Premium version will calculate your exact score and place you among the ranks."
        />
      </section>

      {/* MOCK LEADERBOARDS */}
      <section className="max-w-6xl mx-auto mb-20">
        <h2 className="text-center text-4xl font-display text-red-500 mb-12 drop-shadow-[0_0_25px_rgba(255,0,0,0.4)]">
          Leaderboards (Examples)
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <LeaderboardCard
            title="Bench Press"
            data={[
              { name: "Marcus A.", score: "355 lb" },
              { name: "Damon R.", score: "325 lb" },
              { name: "Elias V.", score: "295 lb" },
            ]}
          />

          <LeaderboardCard
            title="Squat"
            data={[
              { name: "Valerius P.", score: "475 lb" },
              { name: "Kade M.", score: "455 lb" },
              { name: "Juno T.", score: "420 lb" },
            ]}
          />

          <LeaderboardCard
            title="Deadlift"
            data={[
              { name: "Omar R.", score: "585 lb" },
              { name: "Niklas D.", score: "560 lb" },
              { name: "Theo L.", score: "540 lb" },
            ]}
          />

          <LeaderboardCard
            title="Total Strength"
            data={[
              { name: "Kael R.", score: "1335 lb" },
              { name: "Marcos S.", score: "1260 lb" },
              { name: "Riven D.", score: "1215 lb" },
            ]}
          />
        </div>
      </section>

      {/* PREMIUM CTA */}
      <section className="text-center mt-20">
        <h2 className="text-4xl font-display text-red-500 mb-6">
          Want to Know Your True Rank?
        </h2>

        <p className="text-gray-300 max-w-xl mx-auto mb-10">
          The Premium Colosseum evaluates your lifts, bodyweight, and performance  
          to determine your exact placement among lifters worldwide.
        </p>

        <button className="px-12 py-4 bg-red-600 text-black rounded-xl font-display text-xl hover:scale-105 transition-all">
          Unlock Your Ranking (LiftLogic Plus)
        </button>
      </section>

    </div>
  );
}

/* COMPONENTS */

function ColosseumSection({ title, content }) {
  return (
    <div>
      <h2 className="text-3xl font-display text-red-500 mb-3">{title}</h2>
      <p className="text-gray-300 leading-relaxed">{content}</p>
    </div>
  );
}

function LeaderboardCard({ title, data }) {
  return (
    <div className="bg-black/40 border border-red-600/40 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
      <h3 className="text-2xl font-display text-red-500 mb-4">{title}</h3>

      <ul className="space-y-3">
        {data.map((item, i) => (
          <li
            key={i}
            className="flex justify-between bg-black/30 border border-gray-700 rounded-lg px-4 py-2"
          >
            <span className="text-gray-200">{item.name}</span>
            <span className="text-red-400 font-bold">{item.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
