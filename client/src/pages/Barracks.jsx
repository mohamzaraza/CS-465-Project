export default function Barracks() {
  return (
    <div className="min-h-screen bg-[#111] text-white pt-32 pb-20 px-6">

      {/* HERO SECTION */}
      <div className="text-center mb-16">
        <h1 className="text-6xl font-display text-olympus-gold drop-shadow-[0_0_25px_rgba(201,168,106,0.4)]">
          The Barracks
        </h1>
        <p className="text-gray-300 mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
          The foundation of every warrior is their training structure.
          Learn the principles, explore proven splits, and prepare to forge
          a program tailored to your goals.
        </p>
      </div>

      {/* EDUCATION SECTION */}
      <section className="max-w-4xl mx-auto mb-20">
        <h2 className="text-3xl font-display text-olympus-gold mb-4">
          What Is a Training Split?
        </h2>
        <p className="text-gray-300 leading-relaxed mb-8">
          A training split determines how you divide your muscle groups across the week.
          The right split depends on your experience, recovery capacity, lifestyle,
          and goals — not trends.
        </p>

        <h2 className="text-3xl font-display text-olympus-gold mb-4">
          How Many Days Should You Train?
        </h2>
        <p className="text-gray-300 leading-relaxed mb-8">
          More is not always better. Beginners grow with 2–3 days per week. 
          Intermediates thrive with 3–5. Advanced lifters may push 5–6, but only
          with structured progression and recovery.
        </p>

        <h2 className="text-3xl font-display text-olympus-gold mb-4">
          Why Splits Matter
        </h2>
        <p className="text-gray-300 leading-relaxed">
          A good split ensures balanced development, avoids fatigue overlap,
          maximizes recovery, and keeps you progressing week after week.
        </p>
      </section>

      {/* SPLIT EXAMPLE CARDS */}
      <section className="max-w-6xl mx-auto mb-20">
        <h2 className="text-center text-4xl font-display text-olympus-gold mb-12">
          Example Training Splits
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Full Body */}
          <SplitCard 
            title="Full Body"
            days="2–3 Days/Week"
            description="Ideal for beginners or busy lifters. High frequency, simple progression, balanced workload."
          />
          
          {/* Upper Lower */}
          <SplitCard 
            title="Upper / Lower"
            days="4 Days/Week"
            description="A staple split offering great recovery and balanced hypertrophy."
          />

          {/* Push Pull Legs */}
          <SplitCard 
            title="Push / Pull / Legs"
            days="5–6 Days/Week"
            description="Perfect for dedicated lifters. Higher volume, great specialization."
          />

          {/* Bro Split */}
          <SplitCard 
            title="Bro Split"
            days="5 Days/Week"
            description="Classic bodybuilding style. High volume per muscle group."
          />

          {/* Hybrid Powerbuilding */}
          <SplitCard 
            title="Powerbuilding Hybrid"
            days="4–5 Days/Week"
            description="Strength-focused compounds + aesthetic accessory work."
          />
        </div>
      </section>

      {/* PREMIUM CTA */}
      <section className="text-center mt-20">
        <h2 className="text-4xl font-display text-olympus-gold mb-6">
          Ready for a Split Tailored to YOU?
        </h2>

        <p className="text-gray-300 max-w-2xl mx-auto mb-10">
          Your schedule. Your goals. Your weak points.  
          The Barracks Premium builds a precise training blueprint based on your stats.
        </p>

        <button className="px-12 py-4 bg-olympus-gold text-black rounded-xl font-display text-xl hover:scale-105 transition-all">
          Unlock The Personalized Barracks (LiftLogic Plus)
        </button>
      </section>

    </div>
  );
}

// 🔹 Reusable Split Card
function SplitCard({ title, days, description }) {
  return (
    <div className="bg-black/40 border border-gray-700/40 p-6 rounded-2xl backdrop-blur-sm shadow-lg hover:scale-[1.02] transition-all">
      <h3 className="text-2xl font-display text-olympus-gold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{days}</p>
      <p className="text-gray-300">{description}</p>
    </div>
  );
}
