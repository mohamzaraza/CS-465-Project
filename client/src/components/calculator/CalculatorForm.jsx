// src/components/calculator/CalculatorForm.jsx

export default function CalculatorForm({ form, onChange, ageMin, ageMax }) {
  return (
    <form className="space-y-6">
      {/* Sex & Age */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Sex</label>
          <select
            name="sex"
            value={form.sex}
            onChange={onChange}
            className="w-full border rounded px-3 py-2 text-black"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Age (years)</label>
          <input
            type="number"
            name="age"
            value={form.age}
            onChange={onChange}
            className="w-full border rounded px-3 py-2 text-black"
            min={ageMin}
            max={ageMax}
            step="1"
            inputMode="numeric"
            onKeyDown={(e) => {
              // Block: decimals, minus, plus, exponent
              if ([".", "-", "+", "e", "E"].includes(e.key)) {
                e.preventDefault();
              }
            }}
          />
        </div>
      </div>

      {/* Weight */}
      <div>
        <label className="block text-sm font-medium mb-1">Weight</label>
        <div className="flex gap-2">
          <input
            type="number"
            name="weight"
            value={form.weight}
            onChange={onChange}
            className="w-full border rounded px-3 py-2 text-black"
            min="0"
            step="0.1"
          />
          <select
            name="weightUnit"
            value={form.weightUnit}
            onChange={onChange}
            className="border rounded px-3 py-2 text-black"
          >
            <option value="kg">kg</option>
            <option value="lbs">lbs</option>
          </select>
        </div>
      </div>

      {/* Height */}
      <div>
        <label className="block text-sm font-medium mb-1">Height</label>

        <div className="flex items-center gap-4 mb-2">
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              name="heightUnit"
              value="cm"
              checked={form.heightUnit === "cm"}
              onChange={onChange}
            />
            <span>cm</span>
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              name="heightUnit"
              value="ft"
              checked={form.heightUnit === "ft"}
              onChange={onChange}
            />
            <span>ft / in</span>
          </label>
        </div>

        {form.heightUnit === "cm" ? (
          <input
            type="number"
            name="heightCm"
            value={form.heightCm}
            onChange={onChange}
            className="w-full border rounded px-3 py-2 text-black"
            min="0"
            step="0.1"
            placeholder="Height in cm"
          />
        ) : (
          <div className="flex gap-2">
            <input
              type="number"
              name="heightFeet"
              value={form.heightFeet}
              onChange={onChange}
              className="w-1/2 border rounded px-3 py-2 text-black"
              min="0"
              placeholder="Feet"
            />
            <input
              type="number"
              name="heightInches"
              value={form.heightInches}
              onChange={onChange}
              className="w-1/2 border rounded px-3 py-2 text-black"
              min="0"
              placeholder="Inches"
            />
          </div>
        )}
      </div>

      {/* Activity (general lifestyle) */}
      <div>
        <label className="block text-sm font-medium mb-1">Activity Level</label>
        <select
          name="activity"
          value={form.activity}
          onChange={onChange}
          className="w-full border rounded px-3 py-2 text-black"
        >
          <option value="sedentary">Sedentary (little or no exercise)</option>
          <option value="light">Light (1–3 days/week)</option>
          <option value="moderate">Moderate (3–5 days/week)</option>
          <option value="very">Very active (6–7 days/week)</option>
          <option value="extra">Extra active (hard physical job / 2x training)</option>
        </select>
      </div>

      {/* Training level (specifically for lifting / workouts) */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Resistance Training Level
        </label>
        <select
          name="trainingLevel"
          value={form.trainingLevel ?? "moderate"}
          onChange={onChange}
          className="w-full border rounded px-3 py-2 text-black"
        >
          <option value="none">I don't lift / very rarely</option>
          <option value="light">Light (1–2 sessions per week)</option>
          <option value="moderate">Moderate (3–4 sessions per week)</option>
          <option value="hard">Hard (5+ intense sessions per week)</option>
        </select>
      </div>

      {/* Goal */}
      <div>
        <label className="block text-sm font-medium mb-1">Goal</label>
        <select
          name="goal"
          value={form.goal}
          onChange={onChange}
          className="w-full border rounded px-3 py-2 text-black"
        >
          <option value="cut">Lose fat (cut)</option>
          <option value="maintain">Maintain weight</option>
          <option value="bulk">Gain muscle (bulk)</option>
        </select>
      </div>

      {/* Dynamic Deficit / Surplus Slider */}
{form.goal !== "maintain" && (
  <div className="mt-2">
    <label className="block text-sm font-medium mb-1">
      {form.goal === "cut" ? "Calorie Deficit" : "Calorie Surplus"} (% of TDEE)
    </label>

    <input
      type="range"
      name="adjustmentPercent"
      min="5"
      max="50"
      step="1"
      value={form.adjustmentPercent ?? (form.goal === "cut" ? 20 : 15)}
      onChange={onChange}
      className="w-full"
    />

    <p className="text-xs text-gray-600 mt-1">
      This adjusts your calories by about{" "}
      <span className="font-semibold">
        {form.adjustmentPercent ?? (form.goal === "cut" ? 20 : 15)}%
      </span>{" "}
      relative to your estimated daily energy expenditure (TDEE).
    </p>
  </div>
)}

    </form>
  );
}
