// ================================================
//  CALCULATOR PAGE
//  - Greek-inspired "Temple of Logic" styling
//  - State, validation, live updates
//  - UI split into <CalculatorForm /> + <CalculatorResults />
// ================================================

import { useState, useMemo } from "react";

// Components
import CalculatorForm from "../components/calculator/CalculatorForm";
import CalculatorResults from "../components/calculator/CalculatorResults";

// Utils (math + validation logic)
import {
  computeResults,
  toNumber,
  AGE_MIN,
  AGE_MAX,
} from "../utils/calculatorUtils";


// ----------------------------------------------
//  EXTREME ADJUSTMENT WARNING COMPONENT
// ----------------------------------------------
function ExtremeAdjustmentWarning({ goal, percent }) {
  const goalLabel = goal === "cut" ? "calorie deficit" : "calorie surplus";

  return (
    <div className="border border-red-500/60 bg-gradient-to-br from-red-900/40 via-[#240909] to-black text-red-100 rounded-xl p-4 md:p-5 space-y-3 shadow-[0_0_25px_rgba(127,29,29,0.45)]">
      <h2 className="text-lg font-semibold tracking-wide">
        Easy there. This is extremely aggressive.
      </h2>

      <p className="text-sm leading-relaxed">
        You&apos;ve set your {goalLabel} to about{" "}
        <span className="font-bold">{percent.toFixed(0)}%</span>{" "}
        relative to your estimated daily energy needs (TDEE). At this level,
        the risk of muscle loss, burnout, and rebound weight gain goes way up.
      </p>

      <ul className="text-sm list-disc list-inside space-y-1 text-red-100/90">
        <li>Consistency beats intensity.</li>
        <li>Sustainable progress comes from smart, steady changes.</li>
        <li>Your body needs fuel to train hard and recover.</li>
      </ul>

      <p className="text-sm leading-relaxed">
        Try bringing your {goalLabel} into the{" "}
        <span className="font-semibold">5–25% range</span> and pair it with a
        solid training and nutrition plan to get the best long-term results.
      </p>

      {/* Placeholder CTAs – wired up once pages are ready */}
      <div className="flex flex-col gap-2 mt-3 text-sm">
        <button
          className="inline-block text-center border border-red-400/60 rounded-md px-3 py-2 opacity-60 cursor-not-allowed"
        >
          Workouts (coming soon)
        </button>
        <button
          className="inline-block text-center border border-red-400/60 rounded-md px-3 py-2 opacity-60 cursor-not-allowed"
        >
          Dieting Tips (coming soon)
        </button>
      </div>

      <p className="text-xs text-red-200/80 mt-2 italic">
        “Consistency is better than intensity.” Small, sustainable
        changes will take you further than any crash approach.
      </p>
    </div>
  );
}


// ================================================
//  MAIN COMPONENT
// ================================================
export default function Calculator() {

  // -----------------------------
  //  FORM STATE
  // -----------------------------
  const [form, setForm] = useState({
    sex: "male",
    age: "",
    weight: "",
    weightUnit: "kg",
    heightCm: "",
    heightFeet: "",
    heightInches: "",
    heightUnit: "cm",
    activity: "moderate",
    trainingLevel: "moderate",
    goal: "maintain",
    adjustmentPercent: 20, // used when cut/bulk
  });

  // -----------------------------
  //  ON INPUT CHANGE
  // -----------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  // -----------------------------
  //  LIVE CALCULATION
  // -----------------------------
  // Results are derived from the form, so compute them during render rather
  // than mirroring them into state (which cost an extra render per keystroke).
  const results = useMemo(() => computeResults(form), [form]);


  // -----------------------------
  //  AGE VALIDATION CHECK
  // -----------------------------
  const ageNumber = toNumber(form.age);
  const ageError =
    ageNumber != null &&
    (ageNumber < AGE_MIN || ageNumber > AGE_MAX);


  // -----------------------------
  //  EXTREME ADJUSTMENT CHECK (>= 30%)
  // -----------------------------
  const adj = toNumber(form.adjustmentPercent);
  const extremeAdjustment =
    form.goal !== "maintain" && adj != null && adj >= 30;


  // ================================================
  //  RENDER
  // ================================================
  return (
    <div
      className="
        min-h-screen w-screen overflow-x-hidden
        flex items-center justify-center
        px-4 pt-28 pb-10
        bg-gradient-to-b from-black via-[#050508] to-[#050308]
        relative
      "
    >
      {/* Background philosopher image */}
      <div
        className="
          pointer-events-none
          absolute inset-0
          bg-[url('/src/assets/calculator-bg.jpg')]
          bg-center bg-contain md:bg-cover
          opacity-30
        "
      />

      {/* CONTENT WRAPPER */}
      <div className="relative w-full max-w-5xl">
        {/* ================= HEADER ================= */}
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-3">
            TEMPLE OF LOGIC
          </p>

          <h1
            className="
              text-2xl md:text-3xl font-display
              text-olympus-gold
              drop-shadow-[0_0_18px_rgba(201,168,106,0.55)]
            "
          >
            LiftLogic Calorie &amp; Protein Engine
          </h1>

          <p className="mt-3 text-sm md:text-base text-gray-300 max-w-2xl leading-relaxed">
            Channel the precision of ancient mathematicians. Enter your stats to
            calculate your BMR, tailored calorie targets, and evidence-based
            protein intake for your current goal and training level.
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Results update automatically as you type.
          </p>
        </header>
        {/* ================= END HEADER ================= */}

        {/* ================= MAIN CARD ================= */}
        <div
          className="
            rounded-2xl border border-olympus-gold/60 shadow-[0_0_18px_rgba(201,168,106,0.35)]
            bg-black/10
            backdrop-blur-xs
            shadow-[0_0_40px_rgba(0,0,0,0.7)]
            p-4 md:p-6
          "
        >

          {/* Decorative “pillars” top border */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-olympus-gold/40 to-transparent" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-olympus-gold drop-shadow-[0_0_6px_rgba(201,168,106,0.45)]">
              CALCULATION CHAMBER
            </span>

            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-olympus-gold/40 to-transparent" />
          </div>

          {/* =======================================================
              LAYOUT: FORM (LEFT) + RESULTS/WARNING (RIGHT)
             ======================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {/* ============= LEFT COLUMN: FORM + AGE ERROR ============= */}
           <div
             className="
               bg-black/10
               backdrop-blur-xs
               rounded-xl
               border border-[#c9a86a40]
               p-4 md:p-5
             "
            >

              <CalculatorForm
                form={form}
                onChange={handleChange}
                ageMin={AGE_MIN}
                ageMax={AGE_MAX}
              />

              {ageError && (
                <p className="text-red-400 text-xs md:text-sm mt-4">
                  Please enter an age between {AGE_MIN} and {AGE_MAX} to get
                  accurate results.
                </p>
              )}
            </div>
            {/* ============= END LEFT COLUMN ============= */}

            {/* ============= RIGHT COLUMN: RESULTS OR WARNING ============= */}
            <div
              className="
                bg-black/10
                backdrop-blur-xs
                rounded-xl
                border border-[#c9a86a40]
                p-4 md:p-5
              "
            >

              {extremeAdjustment ? (
                <ExtremeAdjustmentWarning goal={form.goal} percent={adj} />
              ) : !ageError && results ? (
                <CalculatorResults form={form} results={results} />
              ) : !ageError && !results ? (
                <p className="text-sm text-gray-400">
                  Start by entering your details on the left. Once your stats
                  are complete, this panel will reveal your calorie targets,
                  protein intake, and projected weekly progress.
                </p>
              ) : null}
            </div>
            {/* ============= END RIGHT COLUMN ============= */}
          </div>
          {/* ================= END GRID ================= */}
        </div>
        {/* ================= END MAIN CARD ================= */}
      </div>
    </div>
  );
}

