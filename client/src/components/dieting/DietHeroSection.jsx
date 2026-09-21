// src/components/dieting/DietHeroSection.jsx

import { Link } from "react-router-dom";

export default function DietHeroSection() {
  return (
    <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center">
      <div className="grid grid-cols-1 md:grid-cols-[2fr,1.2fr] gap-8 items-center w-full">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-3">
            DIETING &amp; NUTRITION GUIDE
          </p>
          <h1
            className="
              text-3xl md:text-4xl font-display
              text-olympus-gold
              drop-shadow-[0_0_20px_rgba(201,168,106,0.6)]
            "
          >
            Dieting &amp; Nutrition Guide
          </h1>
          <p className="mt-4 text-sm md:text-base text-gray-200 max-w-3xl leading-relaxed font-body">
            Learn how to fuel your body the right way. This page gives you
            simple principles and an interactive tool to help you build
            better meals—without crash diets or confusion.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/calculator"
              className="
                text-xs md:text-sm
                px-4 py-2 rounded-full
                bg-olympus-gold text-black font-semibold
                tracking-wide
                hover:bg-olympus-goldlight
                transition
              "
            >
              Calculate Your Calories
            </Link>
          </div>
        </div>

        {/* Hero visual block */}
        <div
          className="
            hidden md:flex
            items-center justify-center
            rounded-2xl
            bg-black/40 backdrop-blur-md
            border border-olympus-gold/30
            shadow-gold-glow
            p-6
          "
        >
          <div className="text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
              FUEL LIKE A WARRIOR
            </p>
            <p className="text-sm text-gray-200 font-body">
              Training shapes your body. Nutrition decides how that shape
              looks.
            </p>
            <p className="text-xs text-gray-500 italic">
              “Discipline in diet is mastery over self.”
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
