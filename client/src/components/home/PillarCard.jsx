import { useState } from "react";

export default function PillarCard({
  title,
  frontText,
  backText,
  frontImage,
  backImage,
  color, // "strength", "nutrition", "consistency", "mindset"
}) {
  const [flipped, setFlipped] = useState(false);

  const colorClassMap = {
    strength: "lightning-red",
    nutrition: "lightning-green",
    consistency: "lightning-white",
    mindset: "lightning-gold",
  };

  const lightningClass = colorClassMap[color] || "lightning-white";

  return (
    <div
      className={`flip-card group ${lightningClass}`}
      onClick={() => setFlipped((prev) => !prev)}
    >
      <div className={`flip-inner ${flipped ? "is-flipped" : ""}`}>

        {/* =============== FRONT FACE =============== */}
        <div className="flip-face flip-front relative overflow-hidden">

          {/* Front Symbol Silhouette */}
          {frontImage && (
            <img
              src={frontImage}
              alt={`${title} symbol`}
              className="absolute inset-0 w-full h-full object-contain opacity-70 pointer-events-none -translate-y-12"
            />
          )}

          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />

          <div className="relative z-10 flex flex-col justify-end items-center h-full">
            <h3 className="text-3xl font-display text-olympus-gold mb-3">
              {title}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {frontText}
            </p>
            <p className="mt-4 text-xs text-gray-500 uppercase tracking-[0.2em]">
              Click to flip
            </p>
          </div>
        </div>

        {/* =============== BACK FACE =============== */}
        <div className="flip-face flip-back relative overflow-hidden">

          {/* Back Silhouette */}
          {backImage && (
            <img
              src={backImage}
              alt={`${title} figure`}
              className="absolute inset-0 w-full h-full object-contain opacity-100 pointer-events-none"
            />
          )}

          {/* Darker gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />

          <div className="relative z-10 flex flex-col justify-end items-center h-full">
            <h3 className="text-3xl font-display text-olympus-gold mb-3">
              {title}
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed">
              {backText || frontText}
            </p>
            <p className="mt-4 text-xs text-gray-500 uppercase tracking-[0.2em]">
              Click to return
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}