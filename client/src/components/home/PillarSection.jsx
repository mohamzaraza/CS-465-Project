import React from "react";
import Pillars from "./Pillars";

const pillarsData = [
  {
    title: "Strength",
    frontText:
      "Power. Endurance. Physical mastery. Your body is the temple you forge.",
    backText:
      "Strength is built through disciplined effort — heavy lifts, perfect form, progressive overload, and relentless consistency.",
    
    // FRONT = symbolic Greek icon
    frontImage: "/src/assets/strength-symbol.png",

    // BACK = silhouette of Spartan / warrior
    backImage: "/src/assets/atlas.png",

    color: "strength", // red lightning
  },

  {
    title: "Nutrition",
    frontText:
      "Fuel your transformation with balanced diets, macros, and meal plans.",
    backText:
      "Nutrition is the fuel of discipline — surplus to grow, deficit to cut, macros aligned to your goals.",

    frontImage: "/src/assets/nutrition-symbol.png",   // Symbol
    backImage: "/src/assets/nutrition.png",              // Goddess Demeter silhouette

    color: "nutrition", // green lightning
  },

  {
    title: "Consistency",
    frontText:
      "Discipline is the foundation. Track your progress and stay committed.",
    backText:
      "Consistency beats intensity. Daily routines, habits, tracking, and unbreakable discipline lead to mastery.",

    frontImage: "/src/assets/ouroboros.png",  // Greek column
    backImage: "/src/assets/consistency.png",      // Calm statue silhouette

    color: "consistency", // white lightning
  },

  {
    title: "Mindset",
    frontText:
      "Master your thoughts. Build mental strength. Focus. Resolve.",
    backText:
      "Mindset turns effort into power. Sharpen your focus, embrace discipline, and rise above doubt.",

    frontImage: "/src/assets/helmet.png",      // Laurel wreath
    backImage: "/src/assets/spartan.png",            // Athena statue silhouette

    color: "mindset", // blue lightning
  },
];

export default function PillarsSection() {
  return (
    <section
      className="relative py-32 bg-[url('/src/assets/temple.jpg')]
     bg-center bg-fixed text-white"
    >
      {/* Fade Upper */}
      <div className="absolute top-0 left-0 w-full h-40 
        bg-gradient-to-t from-transparent to-[#111]" />

      {/* Fade Lower */}
      <div className="absolute bottom-0 left-0 w-full h-40 
          bg-gradient-to-b from-transparent to-[#111]" />

      <div className="relative z-10">
        {/* Top Greek border */}
        <div className="w-full text-center text-olympus-gold text-3xl font-display tracking-widest mb-16">
          ────══❖  THE 4 PILLARS OF SUCCESS  ❖══────
        </div>

        {/* Section Header */}
        <div className="text-center mb-20 px-4">
          <h2 className="text-5xl font-display text-olympus-gold drop-shadow-[0_0_15px_rgba(201,168,106,0.45)]">
            Path of Discipline
          </h2>
          <p className="mt-6 text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Four pillars to guide your journey to strength, health, and mastery.
          </p>
        </div>

        {/* Pillars grid */}
        <div className="max-w-6xl mx-auto px-6">
          <Pillars pillars={pillarsData} />
        </div>

        {/* Bottom Greek border */}
        <div className="w-full text-center text-olympus-gold text-3xl font-display tracking-widest mt-20">
          ────══❖  THE 4 PILLARS OF SUCCESS  ❖══────
        </div>
      </div>
    </section>
  );
}