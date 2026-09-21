// src/components/dieting/DietCTASection.jsx

import { Link } from "react-router-dom";

export default function DietCTASection() {
  return (
    <section className="mb-4 text-center">
      <p className="text-sm text-gray-300 mb-4 max-w-2xl mx-auto">
        Use this guide, your calorie calculator results, and the Build Your
        Plate tool together. That’s how you stop guessing and start eating
        with intent.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/calculator"
          className="
            text-xs md:text-sm
            px-4 py-2 rounded-full
            bg-olympus-gold text-black font-semibold
            hover:bg-olympus-goldlight
            transition
          "
        >
          Go to Calorie Calculator
        </Link>
        <Link
          to="/mealplan"
          className="
            text-xs md:text-sm
            px-4 py-2 rounded-full
            border border-gray-500/70 text-gray-200
            hover:bg-white/5
            transition
          "
        >
          Go to Meal Plans
        </Link>
      </div>
    </section>
  );
}
