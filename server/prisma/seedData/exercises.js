// The exercise catalog the seed writes: the source of truth now that the client
// reads exercises from the API. It was copied word for word from the client's
// old static file (client/src/data/exercises.js), and a parity test held the
// two identical until that file was deleted in Enhancement 3.
//
// Keyed by the MuscleGroup enum. `video` is the file name only: the client adds
// its own base path, which differs between dev and the GitHub Pages build.
// Muscles with no content are simply absent; nothing here is invented.

export const EXERCISES_BY_MUSCLE = {
  CHEST: [
    {
      id: "bench-press",
      name: "Barbell Bench Press",
      tier: "newcomer",
      video: "benchpress.mp4",
      muscles: ["Chest", "Triceps", "Front Delts"],
      cues: [
        "Feet planted firmly on the floor",
        "Retract shoulder blades before unracking",
        "Lower the bar to mid-chest",
        "Press upward while maintaining tightness",
      ],
      mistakes: [
        "Flaring elbows excessively",
        "Bouncing the bar off the chest",
        "Losing upper back tension",
      ],
    },

    {
      id: "incline-dumbbell-press",
      name: "Incline Dumbbell Press",
      tier: "warrior",
      video: "inclinedbpress.mp4",
      muscles: ["Upper Chest", "Front Delts", "Triceps"],
      cues: [
        "Bench set to ~30–45° incline",
        "Dumbbells start above chest, not shoulders",
        "Lower with control and elbows slightly tucked",
        "Press up and in slightly at the top",
      ],
      mistakes: [
        "Using too steep of an incline",
        "Letting elbows flare excessively",
        "Losing control at the bottom",
      ],
    },

    {
      id: "weighted-dips",
      name: "Weighted Dips",
      tier: "elite",
      video: "weighteddips.mp4",
      muscles: ["Lower Chest", "Triceps", "Front Delts"],
      cues: [
        "Slight forward torso lean",
        "Elbows track slightly outward",
        "Descend until shoulders are just below elbows",
        "Drive up powerfully without locking out",
      ],
      mistakes: [
        "Staying too upright (turns into triceps dip)",
        "Going too deep and stressing shoulders",
        "Swinging or kipping",
      ],
    },
  ],
};
