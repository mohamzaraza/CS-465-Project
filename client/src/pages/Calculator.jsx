import React, { useState } from "react";

export default function Calculator() {
  const [form, setForm] = useState({
    sex: "male",
    age: "",
    weight: "",
    weightUnit: "kg", // "kg" or "lbs"
    heightCm: "",
    heightFeet: "",
    heightInches: "",
    heightUnit: "cm", // "cm" or "ft"
    activity: "moderate",
    goal: "maintain",
  });

  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toNumber = (value) => {
    const n = parseFloat(value);
    return Number.isNaN(n) ? null : n;
  };

  const getWeightKg = () => {
    const w = toNumber(form.weight);
    if (w == null) return null;
    return form.weightUnit === "kg" ? w : w * 0.453592;
  };

  const getHeightCm = () => {
    if (form.heightUnit === "cm") {
      const h = toNumber(form.heightCm);
      return h == null ? null : h;
    } else {
      const feet = toNumber(form.heightFeet);
      const inches = toNumber(form.heightInches);
      if (feet == null || inches == null) return null;
      return feet * 30.48 + inches * 2.54;
    }
  };

  const calculateBMR = (sex, weightKg, heightCm, age) => {
    if (sex === "male") {
      return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }
  };

  const getActivityMultiplier = (activity) => {
    switch (activity) {
      case "sedentary":
        return 1.2;
      case "light":
        return 1.375;
      case "moderate":
        return 1.55;
      case "very":
        return 1.725;
      case "extra":
        return 1.9;
      default:
        return 1.55;
    }
  };

  const getProteinPerKg = (goal) => {
    switch (goal) {
      case "cut":
        return 2.2;
      case "bulk":
        return 2.0;
      case "maintain":
      default:
        return 1.8;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const age = toNumber(form.age);
    const weightKg = getWeightKg();
    const heightCm = getHeightCm();

    if (!age || !weightKg || !heightCm) {
      setError("Please fill in age, weight, and height with valid numbers.");
      setResults(null);
      return;
    }

    const bmr = calculateBMR(form.sex, weightKg, heightCm, age);
    const activityMultiplier = getActivityMultiplier(form.activity);
    const tdee = bmr * activityMultiplier;

    const caloriesMaintain = tdee;
    const caloriesCut = tdee * 0.8;   // 20% deficit
    const caloriesBulk = tdee * 1.15; // 15% surplus

    const proteinPerKg = getProteinPerKg(form.goal);
    const proteinGrams = proteinPerKg * weightKg;

    setResults({
      bmr,
      tdee,
      caloriesMaintain,
      caloriesCut,
      caloriesBulk,
      proteinGrams,
      proteinPerKg,
      weightKg,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-4">LiftLogic Calorie & Protein Calculator</h1>
        <p className="mb-6 text-sm text-gray-700">
          Enter your details to estimate your BMR, maintenance calories, calories for cutting or bulking,
          and recommended protein intake.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sex & Age */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sex</label>
              <select
                name="sex"
                value={form.sex}
                onChange={handleChange}
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
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-black"
                min="0"
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
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-black"
                min="0"
                step="0.1"
              />
              <select
                name="weightUnit"
                value={form.weightUnit}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-black"
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
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-black"
                />
                <span>cm</span>
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  name="heightUnit"
                  value="ft"
                  checked={form.heightUnit === "ft"}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-black"
                />
                <span>ft / in</span>
              </label>
            </div>

            {form.heightUnit === "cm" ? (
              <input
                type="number"
                name="heightCm"
                value={form.heightCm}
                onChange={handleChange}
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
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-black"
                  min="0"
                  placeholder="Feet"
                />
                <input
                  type="number"
                  name="heightInches"
                  value={form.heightInches}
                  onChange={handleChange}
                  className="w-1/2 border rounded px-3 py-2 text-black"
                  min="0"
                  placeholder="Inches"
                />
              </div>
            )}
          </div>

          {/* Activity */}
          <div>
            <label className="block text-sm font-medium mb-1">Activity Level</label>
            <select
              name="activity"
              value={form.activity}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-black"
            >
              <option value="sedentary">Sedentary (little or no exercise)</option>
              <option value="light">Light (1–3 days/week)</option>
              <option value="moderate">Moderate (3–5 days/week)</option>
              <option value="very">Very active (6–7 days/week)</option>
              <option value="extra">Extra active (hard physical job / 2x training)</option>
            </select>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium mb-1">Goal</label>
            <select
              name="goal"
              value={form.goal}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-black"
            >
              <option value="cut">Lose fat (cut)</option>
              <option value="maintain">Maintain weight</option>
              <option value="bulk">Gain muscle (bulk)</option>
            </select>
          </div>

          {/* Error */}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            className="px-4 py-2 rounded bg-black text-white text-sm font-semibold"
          >
            Calculate
          </button>
        </form>

        {/* Results */}
        {results && (
          <div className="mt-8 border rounded-lg p-4 space-y-4">
            <h2 className="text-xl font-semibold mb-2">Results</h2>

            <div>
              <h3 className="font-medium">BMR</h3>
              <p className="text-sm">
                Your estimated BMR is{" "}
                <span className="font-semibold">
                  {results.bmr.toFixed(0)} calories/day
                </span>
                . This is how much you&apos;d burn if you stayed in bed all day.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Maintenance Calories (TDEE)</h3>
              <p className="text-sm">
                Your estimated maintenance (TDEE) is{" "}
                <span className="font-semibold">
                  {results.tdee.toFixed(0)} calories/day
                </span>
                .
              </p>
            </div>

            <div>
              <h3 className="font-medium">Calorie Targets</h3>
              <ul className="text-sm list-disc list-inside space-y-1">
                <li>
                  <span className="font-semibold">Cut (≈20% deficit):</span>{" "}
                  {results.caloriesCut.toFixed(0)} kcal/day
                </li>
                <li>
                  <span className="font-semibold">Maintain:</span>{" "}
                  {results.caloriesMaintain.toFixed(0)} kcal/day
                </li>
                <li>
                  <span className="font-semibold">Bulk (≈15% surplus):</span>{" "}
                  {results.caloriesBulk.toFixed(0)} kcal/day
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium">Protein Intake</h3>
              <p className="text-sm">
                Based on your goal (
                <span className="font-semibold">{form.goal}</span>), we recommend about{" "}
                <span className="font-semibold">
                  {results.proteinPerKg.toFixed(1)} g/kg
                </span>{" "}
                of bodyweight.
              </p>
              <p className="text-sm">
                For your weight (~
                {results.weightKg.toFixed(1)} kg), that&apos;s about{" "}
                <span className="font-semibold">
                  {results.proteinGrams.toFixed(0)} g of protein per day
                </span>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
