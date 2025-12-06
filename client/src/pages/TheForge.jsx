export default function TheForge() {
  return (
    <div className="min-h-screen bg-[#111] text-white pt-32 pb-20 px-6">

      {/* HERO */}
      <div className="text-center mb-16">
        <h1 className="text-6xl font-display text-olympus-gold drop-shadow-[0_0_25px_rgba(201,168,106,0.4)]">
          The Forge
        </h1>
        <p className="text-gray-300 mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
          Strength is trained in the Barracks, but the body is built here —
          through nutrition, consistency, and discipline. Learn the principles,
          study proven templates, and prepare to forge a diet tailored to your goals.
        </p>
      </div>

      {/* EDUCATION SECTION */}
      <section className="max-w-4xl mx-auto mb-20 space-y-10">

        <NutritionSection
          title="Caloric Balance"
          content="Your total daily calories determine whether you gain, lose, or maintain weight. Bulking requires a surplus. Cutting requires a deficit. Maintenance fuels performance."
        />

        <NutritionSection
          title="Macronutrients"
          content="Protein repairs and builds muscle. Carbs fuel training. Fats support hormones and recovery. Ratio matters less than consistency."
        />

        <NutritionSection
          title="Hydration & Electrolytes"
          content="Most lifters overestimate protein and underestimate hydration. Water, sodium, potassium, and magnesium are critical for performance."
        />

        <NutritionSection
          title="Meal Structure"
          content="You don’t need 7 meals a day. You need consistency. Anchor your nutrition around 2–4 structured meals with enough protein."
        />

        <NutritionSection
          title="Fiber & Vegetables"
          content="Digestion affects training more than people realize. 20–35g of fiber per day improves recovery, appetite control, and energy."
        />

      </section>

      {/* EXAMPLE TEMPLATE CARDS */}
      <section className="max-w-6xl mx-auto mb-20">
        <h2 className="text-center text-4xl font-display text-olympus-gold mb-12">
          Example Meal Templates
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          <ForgeCard
            title="Bulking Day"
            note="High calories • High protein"
            meals={[
              "Breakfast: Eggs, oats, fruit",
              "Lunch: Chicken, rice, veggies",
              "Dinner: Beef, potatoes, greens",
              "Snacks: Greek yogurt, nuts, whey"
            ]}
          />

          <ForgeCard
            title="Cutting Day"
            note="High satiety • Controlled calories"
            meals={[
              "Breakfast: Egg whites + berries",
              "Lunch: Lean turkey bowl",
              "Dinner: Salmon + greens",
              "Snacks: Protein shake, veggies"
            ]}
          />

          <ForgeCard
            title="High-Protein Day"
            note="For recovery + muscle repair"
            meals={[
              "Breakfast: Greek yogurt bowl",
              "Lunch: Chicken wrap",
              "Dinner: Steak + potatoes",
              "Snacks: Cottage cheese, whey"
            ]}
          />

          <ForgeCard
            title="Budget Meal Plan"
            note="Cheap • Effective • No fluff"
            meals={[
              "Oats + eggs",
              "Rice + ground beef",
              "Chicken + potatoes",
              "Beans + veggies"
            ]}
          />

          <ForgeCard
            title="Busy Schedule Plan"
            note="Minimal cooking • Fast prep"
            meals={[
              "Protein shake + fruit",
              "Pre-made chicken bowl",
              "Air fryer salmon + rice",
              "Nuts, yogurt, protein bar"
            ]}
          />

        </div>
      </section>

      {/* PREMIUM CTA */}
      <section className="text-center mt-20">
        <h2 className="text-4xl font-display text-olympus-gold mb-6">
          Want a Meal Plan Built for YOUR Body?
        </h2>

        <p className="text-gray-300 max-w-2xl mx-auto mb-10">
          Your calories. Your macros. Your preferences.  
          The Forge Premium creates a tailored diet — from protein targets to grocery lists.
        </p>

        <button className="px-12 py-4 bg-olympus-gold text-black rounded-xl font-display text-xl hover:scale-105 transition-all">
          Unlock The Personalized Forge (LiftLogic Plus)
        </button>
      </section>

    </div>
  );
}

/* COMPONENTS */

function NutritionSection({ title, content }) {
  return (
    <div>
      <h2 className="text-3xl font-display text-olympus-gold mb-3">{title}</h2>
      <p className="text-gray-300 leading-relaxed">{content}</p>
    </div>
  );
}

function ForgeCard({ title, note, meals }) {
  return (
    <div className="bg-black/40 border border-gray-700/40 p-6 rounded-2xl backdrop-blur-sm shadow-lg hover:scale-[1.02] transition-all">
      <h3 className="text-2xl font-display text-olympus-gold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{note}</p>

      <ul className="text-gray-300 space-y-2">
        {meals.map((m, i) => (
          <li key={i} className="list-disc list-inside">{m}</li>
        ))}
      </ul>
    </div>
  );
}
