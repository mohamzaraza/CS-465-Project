// src/pages/About.jsx
import React from "react";

export default function About() {
  return (
    <div className="w-screen overflow-x-hidden bg-black">
      <section
        className="
          relative min-h-screen w-full
          bg-marble-dark bg-cover bg-center bg-fixed
          flex
        "
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/85 to-black/95" />

        {/* Content */}
        <div className="relative w-full max-w-6xl mx-auto px-4 pt-32 pb-20 flex flex-col gap-12">

          {/* Heading */}
          <header className="text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-3">
              ABOUT LIFTLOGIC
            </p>
            <h1 className="text-3xl md:text-4xl font-display text-olympus-gold drop-shadow-[0_0_20px_rgba(201,168,106,0.55)]">
              The Minds Behind the Temple
            </h1>
            <p className="mt-4 text-sm md:text-base text-gray-300 max-w-3xl mx-auto leading-relaxed">
              LiftLogic is a student-built project blending clean interface design,
              evidence-based logic, and a Greek-inspired aesthetic into a focused
              training and nutrition platform.
            </p>
          </header>

          {/* Team */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Hamza */}
            <div className="bg-black/60 border border-olympus-gold/40 rounded-2xl p-6 flex flex-col items-center text-center shadow-deep">
              <div className="w-28 h-28 rounded-full overflow-hidden border border-olympus-gold/70 shadow-gold-glow mb-4">
                <img src="/src/assets/hamza.jpg" alt="Hamza" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-display text-olympus-gold">Hamza</h3>
              <p className="text-xs uppercase tracking-[0.15em] text-gray-400 mb-3">
                Frontend • UI / UX
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                Designed and implemented the calorie calculator, dieting guide, and interactive nutrition tools.
                Focused on turning complex concepts into clean, usable interfaces while handling site-wide structure, footer navigation, and page integration.
              </p>
            </div>

            {/* Emiliano */}
            <div className="bg-black/60 border border-olympus-gold/40 rounded-2xl p-6 flex flex-col items-center text-center shadow-deep">
              <div className="w-28 h-28 rounded-full overflow-hidden border border-olympus-gold/70 shadow-gold-glow mb-4">
                <img src="/src/assets/emi.jpg" alt="Emiliano" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-display text-olympus-gold">Emiliano</h3>
              <p className="text-xs uppercase tracking-[0.15em] text-gray-400 mb-3">
                Logic • Systems
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                Architected the core systems behind LiftLogic, including backend infrastructure, workout programming logic, and AI-driven features.
                Leads fitness methodology, premium feature design (LiftLogic+), competition systems, and personalized coaching through Kev AI.
              </p>
            </div>

            {/* Kev */}
            <div className="bg-black/50 border border-white/20 rounded-2xl p-6 flex flex-col items-center text-center shadow-deep">
              <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-400/40 mb-4">
                <img src="/src/assets/kev.jpg" alt="Kev" className="w-full h-full object-cover object-[center_5%]" />
              </div>
              <h3 className="text-lg font-display text-gray-200">Kev</h3>
              <p className="text-xs uppercase tracking-[0.15em] text-gray-500 mb-3">
                Apprentice • Contributor
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Contributes ideas, testing, feedback, and feature exploration
                while learning the systems and structure behind LiftLogic.
              </p>
            </div>

          </div>

          {/* About LiftLogic */}
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-lg md:text-xl font-display text-olympus-gold mb-3 tracking-widest">
              ────══❖  WHAT LIFTLOGIC OFFERS  ❖══────
            </h2>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
              LiftLogic is built as a practical toolkit: calorie and protein calculators,
              structured dieting guidance, interactive meal-building tools, and
              training-focused systems. The goal isn’t hype — it’s clarity,
              consistency, and discipline that actually sticks.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
