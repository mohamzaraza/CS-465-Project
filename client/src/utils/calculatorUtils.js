// src/utils/calculatorUtils.js

export const AGE_MIN = 15;
export const AGE_MAX = 80;

export const toNumber = (value) => {
  const n = parseFloat(value);
  return Number.isNaN(n) ? null : n;
};

export const getWeightKg = (form) => {
  const w = toNumber(form.weight);
  if (w == null) return null;
  return form.weightUnit === "kg" ? w : w * 0.453592;
};

export const getHeightCm = (form) => {
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

export const calculateBMR = (sex, weightKg, heightCm, age) => {
  if (sex === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
};

export const getActivityMultiplier = (activity) => {
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

/**
 * Protein per kg based on goal + resistance training level.
 *
 *  Maintain:
 *    none      -> 1.2
 *    light     -> 1.4
 *    moderate  -> 1.6
 *    hard      -> 1.8
 *
 *  Bulk:
 *    none      -> 1.4
 *    light     -> 1.6
 *    moderate  -> 1.8
 *    hard      -> 2.0
 *
 *  Cut:
 *    none      -> 1.6
 *    light     -> 1.8
 *    moderate  -> 2.0
 *    hard      -> 2.2
 */
export const getProteinPerKg = (goal, trainingLevel = "moderate") => {
  const level = trainingLevel || "moderate";

  if (goal === "cut") {
    switch (level) {
      case "none":
        return 1.6;
      case "light":
        return 1.8;
      case "hard":
        return 2.2;
      case "moderate":
      default:
        return 2.0;
    }
  }

  if (goal === "bulk") {
    switch (level) {
      case "none":
        return 1.4;
      case "light":
        return 1.6;
      case "hard":
        return 2.0;
      case "moderate":
      default:
        return 1.8;
    }
  }

  // maintain (default)
  switch (level) {
    case "none":
      return 1.2;
    case "light":
      return 1.4;
    case "hard":
      return 1.8;
    case "moderate":
    default:
      return 1.6;
  }
};

// Main calculation function used by the page
export const computeResults = (form) => {
  const age = toNumber(form.age);
  const weightKg = getWeightKg(form);
  const heightCm = getHeightCm(form);

  // Not enough inputs
  if (!age || !weightKg || !heightCm) {
    return null;
  }

  // Age validation
  if (age < AGE_MIN || age > AGE_MAX) {
    return null;
  }

  const bmr = calculateBMR(form.sex, weightKg, heightCm, age);
  const activityMultiplier = getActivityMultiplier(form.activity);
  const tdee = bmr * activityMultiplier;

  const caloriesMaintain = tdee;

  // --- Use the slider value directly, allow >25% but cap truly insane values ---
  const rawAdj = toNumber(form.adjustmentPercent);
  let adjustmentPercent = rawAdj;

  if (adjustmentPercent == null || adjustmentPercent < 0) {
    // reasonable defaults if not set
    if (form.goal === "cut") adjustmentPercent = 20;
    else if (form.goal === "bulk") adjustmentPercent = 15;
    else adjustmentPercent = 0;
  }

  // Hard cap at 70% just to avoid nonsense input
  if (adjustmentPercent > 70) adjustmentPercent = 70;

  const isCut = form.goal === "cut";
  const isBulk = form.goal === "bulk";

  // Goal-specific target calories
  let caloriesTarget;
  if (isCut) {
    caloriesTarget = tdee * (1 - adjustmentPercent / 100);
  } else if (isBulk) {
    caloriesTarget = tdee * (1 + adjustmentPercent / 100);
  } else {
    caloriesTarget = tdee; // maintain
  }

  // Still expose "cut" and "bulk" lines for UI if you want them
  const caloriesCut = tdee * (1 - adjustmentPercent / 100);
  const caloriesBulk = tdee * (1 + adjustmentPercent / 100);

  // --- Estimated weekly weight change ---
  // 3500 kcal ≈ 1 lb, 7700 kcal ≈ 1 kg (rough estimate)
  const dailyDelta = caloriesTarget - tdee; // negative = deficit (loss), positive = surplus (gain)
  const weeklyKcals = dailyDelta * 7;
  const weeklyChangeLbs = weeklyKcals / 3500;
  const weeklyChangeKg = weeklyKcals / 7700;

  const proteinPerKg = getProteinPerKg(form.goal, form.trainingLevel);
  const proteinGrams = proteinPerKg * weightKg;

  return {
    bmr,
    tdee,
    caloriesMaintain,
    caloriesCut,
    caloriesBulk,
    caloriesTarget,
    dailyDelta,
    weeklyChangeLbs,
    weeklyChangeKg,
    proteinGrams,
    proteinPerKg,
    weightKg,
    adjustmentPercent,
  };
};
