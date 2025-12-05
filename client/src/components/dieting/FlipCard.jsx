// src/components/dieting/FlipCard.jsx

import React, { useState } from "react";

/**
 * Flippable info card styled to match LiftLogic vibes.
 */
export default function FlipCard({ title, front, back }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      className={`
        w-full text-left
        bg-black/40 backdrop-blur-md rounded-2xl
        border border-olympus-gold/25
        shadow-deep
        transition-all duration-500 transform
        hover:-translate-y-2 hover:shadow-gold-glow
        px-4 py-4 md:px-5 md:py-5
      `}
    >
      <h3 className="font-display text-sm md:text-base text-olympus-gold mb-2">
        {title}
      </h3>

      <p
        className={`text-[11px] md:text-sm text-gray-200 leading-relaxed ${
          flipped ? "hidden" : "block"
        }`}
      >
        {front}
      </p>
      <p
        className={`text-[11px] md:text-sm text-gray-300 leading-relaxed ${
          flipped ? "block" : "hidden"
        }`}
      >
        {back}
      </p>

      <p className="mt-3 text-[10px] text-gray-500 uppercase tracking-[0.2em]">
        {flipped ? "Tap to show summary" : "Tap to learn more"}
      </p>
    </button>
  );
}
