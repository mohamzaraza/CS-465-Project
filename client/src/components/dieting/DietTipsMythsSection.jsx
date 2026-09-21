// src/components/dieting/DietTipsMythsSection.jsx

import FlipCard from "./FlipCard";

export default function DietTipsMythsSection() {
  return (
    <section className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tips column */}
        <div>
          <div className="w-full text-center text-olympus-gold text-2xl font-display tracking-widest mb-8">
            ────══❖  GOAL-BASED TIPS  ❖══────
          </div>
          <div className="grid grid-cols-1 gap-4 text-xs md:text-sm">
            <FlipCard
              title="Fat Loss Tips"
              front="Moderate deficit, high protein, low liquid calories."
              back="Stay in a moderate deficit—not starvation. Keep protein high, use high-volume foods like veggies and fruit, and cut down on liquid calories from soda, juices, and heavy coffees."
            />
            <FlipCard
              title="Muscle Gain Tips"
              front="Small surplus, plenty of carbs around training."
              back="Slightly above maintenance calories is enough. Keep protein high, add carbs around training sessions, and use calorie-dense foods if you struggle to eat enough."
            />
            <FlipCard
              title="Healthy Lifestyle Tips"
              front="Simple structure, mostly whole foods, long-term habits."
              back="Aim for 2–4 meals per day, mostly whole foods, and habits you can sustain a year from now. Sleep, hydration, and stress management matter just as much as macros."
            />
          </div>
        </div>

        {/* Myths column */}
        <div>
          <div className="w-full text-center text-red-300 text-2xl md:text-3xl font-display tracking-widest mb-8 whitespace-nowrap">
            ────══❖  MYTHS & MISTAKES  ❖══────
          </div>
          <div className="grid grid-cols-1 gap-4 text-xs md:text-sm">
            <FlipCard
              title="“Carbs make you fat.”"
              front="Extra calories make you fat, not one macro."
              back="Carbs don’t magically store as fat. Consistently eating above your calorie needs does. Carbs are actually useful for training performance and recovery."
            />
            <FlipCard
              title="“Eating after 8pm is bad.”"
              front="Timing is secondary. Total intake wins."
              back="Your body doesn’t care what time it is. What matters is total calories and protein by the end of the day, not the clock."
            />
            <FlipCard
              title="“You must eat clean 24/7.”"
              front="You need control, not obsession."
              back="You don’t have to eat perfectly to see results. You just need structure, awareness of portions, and consistency most of the time."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
