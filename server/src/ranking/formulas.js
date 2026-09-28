// The lift formulas, each written once. The two ranking engines used to carry
// their own copy of epley1RM and to inline the volume product at every call
// site; a single definition is the only way a config can name a formula.
//
// Every formula takes (weight, reps) and returns an unscaled term. The engine
// multiplies the result by the lift's factor, so `weight * reps * 1.1` stays
// `(weight * reps) * 1.1` and the double arithmetic is unchanged.

// Guarded on falsy input because the original bench/deadlift path was: a
// missing weight or rep count contributes 0 rather than NaN. Note that 0 reps
// and NaN are caught here, but a negative weight is truthy and passes through.
export function epley1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
}

// Deliberately unguarded, matching the original accessory lifts: a lift entry
// of `{}` produced NaN there, and the golden-master edge cases pin that.
export function volume(weight, reps) {
  return weight * reps;
}

export const FORMULAS = { epley1RM, volume };
