// src/components/dieting/DietBasicsSection.jsx

import React from "react";
import FlipCard from "./FlipCard";

export default function DietBasicsSection() {
  return (
    <section className="relative">
      <div className="w-full text-center text-olympus-gold text-2xl md:text-3xl font-display tracking-widest mb-8">
        ────══❖  BASICS &amp; PRINCIPLES  ❖══────
      </div>

      <p className="text-sm text-gray-300 mb-4 text-center max-w-2xl mx-auto">
        Tap a card to flip it and see a deeper explanation. Understand the
        rules, then execute them consistently.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <FlipCard
          title="What dieting actually is"
          front="Dieting just means controlling what and how much you eat for a goal."
          back="Dieting isn’t a magic program—it’s intentionally adjusting your intake. Eat less than you burn to lose fat, more to build muscle, or around maintenance to hold your current weight."
        />
        <FlipCard
          title="Calories in vs calories out"
          front="Your body burns energy all day. Intake vs burn determines direction."
          back="Calories in are from food and drinks. Calories out come from your metabolism, movement, and training. Over weeks, this balance—not clean vs dirty food—is what moves the scale."
        />
        <FlipCard
          title="Macros & micronutrients"
          front="Protein, carbs, and fats are macros. Vitamins, minerals, and fiber are micros."
          back="Protein supports muscle and satiety. Carbs fuel training and brain. Fats support hormones. Micros from fruits and vegetables keep everything running properly."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FlipCard
          title="Prioritize protein"
          front="Make protein the anchor of every meal."
          back="Aim to hit your daily protein target first (from the calculator). It keeps you fuller, preserves muscle in a cut, and supports growth when you’re gaining."
        />
        <FlipCard
          title="Whole foods first"
          front="Base your diet on real, minimally processed foods."
          back="Meats, eggs, grains, fruits, vegetables, nuts, and dairy should carry most of your intake. You can still fit in flexible foods as long as your totals stay aligned with your goals."
        />
        <FlipCard
          title="Consistency beats perfection"
          front="Being 80–90% on target every week beats going 100% then quitting."
          back="Most people fail by trying to be perfect, then falling apart. You win by being boringly consistent for months, not perfect for 5 days."
        />
      </div>
    </section>
  );
}
