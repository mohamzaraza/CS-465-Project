// src/components/calculator/CalculatorResults.jsx

export default function CalculatorResults({ form, results }) {
  if (!results) return null;

  const activePercent =
    form.goal === "maintain" ? 0 : results.adjustmentPercent ?? 0;

  const weeklyLbs = Math.abs(results.weeklyChangeLbs ?? 0);
  const weeklyKg = Math.abs(results.weeklyChangeKg ?? 0);

  const isCut = form.goal === "cut";
  const isBulk = form.goal === "bulk";

  const trainingLabel = {
    none: "No / very little resistance training",
    light: "Light training (1–2x/week)",
    moderate: "Moderate training (3–4x/week)",
    hard: "Hard training (5+ intense sessions/week)",
  }[form.trainingLevel ?? "moderate"];

  const changeDirection =
    isCut ? "lose" : isBulk ? "gain" : "change";

  const showWeeklyChange = (isCut || isBulk) && weeklyLbs > 0.05;

  return (
    <div className="space-y-3">
      {/* CALORIE SECTION */}
      <details open className="border rounded-lg p-3">
        <summary className="font-medium cursor-pointer">
          Calorie Calculator
        </summary>

        <div className="mt-3 space-y-3 text-sm">
          <div>
            <h3 className="font-medium">BMR</h3>
            <p>
              Your estimated BMR is{" "}
              <span className="font-semibold">
                {results.bmr.toFixed(0)} calories/day
              </span>
              . This is how much you&apos;d burn if you stayed in bed all day.
            </p>
          </div>

          <div>
            <h3 className="font-medium">Maintenance Calories (TDEE)</h3>
            <p>
              Your estimated maintenance (TDEE) is{" "}
              <span className="font-semibold">
                {results.tdee.toFixed(0)} calories/day
              </span>
              .
            </p>
          </div>

          <div>
            <h3 className="font-medium">Calorie Target</h3>

            {form.goal === "cut" && (
              <p>
                To lose weight (cut), aim for about{" "}
                <span className="font-semibold">
                  {results.caloriesTarget.toFixed(0)} kcal/day
                </span>{" "}
                at roughly a{" "}
                <span className="font-semibold">
                  {activePercent.toFixed(0)}% deficit
                </span>{" "}
                below your TDEE.
              </p>
            )}

            {form.goal === "maintain" && (
              <p>
                To maintain your current weight, aim for about{" "}
                <span className="font-semibold">
                  {results.caloriesMaintain.toFixed(0)} kcal/day
                </span>
                .
              </p>
            )}

            {form.goal === "bulk" && (
              <p>
                To gain weight (bulk), aim for about{" "}
                <span className="font-semibold">
                  {results.caloriesTarget.toFixed(0)} kcal/day
                </span>{" "}
                at roughly a{" "}
                <span className="font-semibold">
                  {activePercent.toFixed(0)}% surplus
                </span>{" "}
                above your TDEE.
              </p>
            )}

            {showWeeklyChange && (
              <p className="mt-2 text-xs text-gray-400">
                At this setting, you&apos;re projected to{" "}
                <span className="font-semibold">
                  {changeDirection} about {weeklyLbs.toFixed(2)} lb
                  {" / "}
                  {weeklyKg.toFixed(2)} kg per week
                </span>{" "}
                (rough estimate, assuming consistency).
              </p>
            )}
          </div>
        </div>
      </details>

      {/* PROTEIN SECTION */}
      <details className="border rounded-lg p-3">
        <summary className="font-medium cursor-pointer">
          Protein Recommendation
        </summary>

        <div className="mt-3 text-sm space-y-2">
          <p>
            Based on your goal (
            <span className="font-semibold">{form.goal}</span>) and your
            resistance training level (
            <span className="font-semibold">{trainingLabel}</span>
            ), we recommend about{" "}
            <span className="font-semibold">
              {results.proteinPerKg.toFixed(1)} g/kg
            </span>{" "}
            of bodyweight per day.
          </p>
          <p>
            For your weight (~
            {results.weightKg.toFixed(1)} kg), that&apos;s about{" "}
            <span className="font-semibold">
              {results.proteinGrams.toFixed(0)} g of protein per day
            </span>
            .
          </p>
        </div>
      </details>
    </div>
  );
}
