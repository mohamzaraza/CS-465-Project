import React from "react";
import Pillars from "./Pillars";

const pillarsData = [
  {
    title: "Strength",
    description:
      "Build your power, your endurance, and your resilience through structured workouts and guided routines.",
    image: "/src/assets/arnold-back.jpg",
  },
  {
    title: "Nutrition",
    description:
      "Fuel your transformation with balanced diets, macros, and meal plans tailored for your goals.",
    image: "/src/assets/pillar-nutrition.png",
  },
  {
    title: "Consistency",
    description:
      "Discipline is the foundation. Track progress, stay consistent, and form unbreakable habits.",
    image: "/src/assets/pillar-consistency.png",
  },
  {
    title: "Mindset",
    description:
      "Develop mental fortitude, focus, and motivation. Your mind is the true muscle of transformation.",
    image: "/src/assets/pillar-mindset.png",
  },
];

export default function PillarsSection() {
  return (
    <section className="relative py-32 bg-[url('/src/assets/temple.jpg')]
     bg-center bg-fixed text-white">

      {/* Top Greek border */}
      <div className="w-full text-center text-olympus-gold text-3xl font-display tracking-widest mb-16">
        ────══❖  SILVER MEANDER BORDER  ❖══────
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

      {/* Pillars */}
      <div className="max-w-6xl mx-auto px-6">
        <Pillars pillars={pillarsData} />
      </div>

      {/* Bottom Greek border */}
      <div className="w-full text-center text-olympus-gold text-3xl font-display tracking-widest mt-20">
        ────══❖  SILVER MEANDER BORDER  ❖══────
      </div>

    </section>
  );
}

