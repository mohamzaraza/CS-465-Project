// src/data/chestExercises.js

// Videos live in public/, which Vite serves from the base path ("/" in dev,
// "/CS-465-Project/" on GitHub Pages), so a bare "/videos/..." 404s once deployed.
const videoUrl = (file) => `${import.meta.env.BASE_URL}videos/${file}`;

export const chestExercises = [
  {
    id: "bench-press",
    name: "Barbell Bench Press",
    tier: "newcomer",
    video: videoUrl("benchpress.mp4"),
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
    video: videoUrl("inclinedbpress.mp4"),
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
    video: videoUrl("weighteddips.mp4"),
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
];
