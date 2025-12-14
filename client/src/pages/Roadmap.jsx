// src/pages/Roadmap.jsx

export default function Roadmap() {
  return (
    <section
      className="
        relative min-h-screen w-screen
        bg-[url('/src/assets/greymarble.jpg')]
        bg-cover bg-center bg-fixed
        flex items-center justify-center
        text-gray-200
        overflow-hidden
      "
    >
      {/* Dark overlay to make marble much darker */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/93 to-black/98" />

      {/* Subtle inner vignette to focus center */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0,transparent_55%)]
            opacity-20
          "
        />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-20 space-y-10">

        {/* Header */}
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-3">
            LIFTLOGIC ROADMAP
          </p>
          <h1 className="text-3xl md:text-4xl font-display text-olympus-gold drop-shadow-[0_0_20px_rgba(201,168,106,0.55)]">
            Where the Temple is Heading
          </h1>
          <p className="mt-4 text-sm md:text-base text-gray-300 max-w-3xl mx-auto leading-relaxed">
            This isn&apos;t a finished product. It&apos;s a living project built layer
            by layer — calculators, guides, workouts, and systems that connect.
            Here&apos;s how we see it evolving.
          </p>
        </div>

        {/* Roadmap columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 text-sm md:text-base">
          {/* COLUMN 1 — NOW */}
          <div className="bg-black/70 border border-olympus-gold/40 rounded-2xl p-5 shadow-[0_0_25px_rgba(0,0,0,0.7)]">
            <h2 className="text-lg font-display text-olympus-gold mb-2 uppercase tracking-wide">
              Phase I — Now
            </h2>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Calorie &amp; protein calculator with smart constraints</li>
              <li>• Dieting &amp; nutrition guide with Build Your Plate</li>
              <li>• Greek-inspired UI and core site structure</li>
              <li>• Main flows: Home, Calculator, Dieting, About, Philosophy</li>
            </ul>
          </div>

          {/* COLUMN 2 — NEXT */}
          <div className="bg-black/70 border border-olympus-gold/40 rounded-2xl p-5 shadow-[0_0_25px_rgba(0,0,0,0.7)]">
            <h2 className="text-lg font-display text-olympus-gold mb-2 uppercase tracking-wide">
              Phase II — Next
            </h2>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Structured meal plan page tied to calculator outputs</li>
              <li>• Workout section with sample programs and progression logic</li>
              <li>• Expanded food database in Build Your Plate</li>
              <li>• More polish on mobile and transitions between sections</li>
            </ul>
          </div>

          {/* COLUMN 3 — LATER */}
          <div className="bg-black/70 border border-olympus-gold/40 rounded-2xl p-5 shadow-[0_0_25px_rgba(0,0,0,0.7)]">
            <h2 className="text-lg font-display text-olympus-gold mb-2 uppercase tracking-wide">
              Phase III — Vision
            </h2>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• User accounts with saved stats, meals, and training templates</li>
              <li>• Progress dashboards for strength, bodyweight, and nutrition</li>
              <li>• Deeper AI guidance for adjusting programs and habits</li>
              <li>• Potential mobile app built on the same core logic</li>
            </ul>
          </div>
        </div>

        {/* Closing line */}
        <p className="text-xs md:text-sm text-gray-400 max-w-3xl mx-auto text-center leading-relaxed mt-4">
          Right now, LiftLogic is a focused class project. This roadmap is a
          statement of intent — what it can become if the work continues beyond
          the assignment.
        </p>
      </div>
    </section>
  );
}
