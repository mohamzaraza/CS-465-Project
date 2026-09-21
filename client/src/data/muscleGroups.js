// Single source of truth for the workout regions and their muscles. The region
// pages, the muscle page and the routes are all driven from here, so adding a
// muscle is a data change instead of another copied page.
//
// Slugs are part of public URLs (/workouts/:region/:muscle) and must not change.
// Titles, descriptions and intros are copied verbatim from the original pages.

function muscle(region, slug, linkLabel, title, description) {
  return { region, slug, linkLabel, title, description };
}

export const REGIONS = [
  {
    slug: "upper",
    title: "UPPER BODY",
    intro:
      "Build the frame: chest, shoulders, back, arms. Choose a muscle group to begin your training path.",
    // Kept as full literal strings so Tailwind's scanner still generates them.
    gridClassName: "max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10",
    muscles: [
      muscle(
        "upper",
        "chest",
        "CHEST",
        "CHEST",
        "The chest consists of upper, mid, and lower fibers of the pectoralis major. The angle of your press determines the emphasis."
      ),
      muscle(
        "upper",
        "shoulders",
        "SHOULDERS",
        "SHOULDERS",
        "The deltoids consist of anterior, lateral, and posterior heads — each requiring a different movement pattern."
      ),
      muscle(
        "upper",
        "back",
        "BACK",
        "BACK",
        "A complex structure including lats, traps, rhomboids, and spinal erectors — all essential for posture and power."
      ),
      muscle(
        "upper",
        "biceps",
        "BICEPS",
        "BICEPS",
        "Two heads — long and short — responsible for elbow flexion and forearm supination."
      ),
      muscle(
        "upper",
        "triceps",
        "TRICEPS",
        "TRICEPS",
        "Three heads — long, medial, and lateral — responsible for arm extension and upper arm stability."
      ),
      muscle(
        "upper",
        "forearm",
        "FOREARMS",
        "FOREARMS",
        "Wrist flexors, extensors, and grip strength muscles. Critical for lifting longevity and performance."
      ),
    ],
  },
  {
    slug: "lower",
    title: "LOWER BODY",
    intro:
      "The lower body houses your strongest muscle groups — driving power, stability, and athletic performance. Build a foundation that supports every lift and every movement.",
    gridClassName: "max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-10 mt-12",
    muscles: [
      // The region page has always labelled this link "QUADS" while the
      // muscle page itself is titled "QUADRICEPS".
      muscle(
        "lower",
        "quads",
        "QUADS",
        "QUADRICEPS",
        "Vastus lateralis, medialis, intermedius, and rectus femoris — responsible for knee extension and sprint power."
      ),
      muscle(
        "lower",
        "hamstrings",
        "HAMSTRINGS",
        "HAMSTRINGS",
        "A posterior chain powerhouse group involved in hip extension and knee flexion."
      ),
      muscle(
        "lower",
        "glutes",
        "GLUTES",
        "GLUTES",
        "Gluteus maximus, medius, and minimus — vital for hip drive, stability, and explosive strength."
      ),
      muscle(
        "lower",
        "calves",
        "CALVES",
        "CALVES",
        "Gastrocnemius and soleus — essential for ankle stability, jumping power, and lower body symmetry."
      ),
    ],
  },
  {
    slug: "core",
    title: "CORE",
    intro:
      "The core is the body’s stabilizing engine — supporting posture, protecting the spine, and generating strength through every movement.",
    gridClassName: "max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 mt-12",
    muscles: [
      muscle(
        "core",
        "abs",
        "ABS",
        "ABS",
        "Rectus abdominis, serratus anterior, and deep core stabilizers — fundamental for posture and bracing."
      ),
      muscle(
        "core",
        "obliques",
        "OBLIQUES",
        "OBLIQUES",
        "Internal and external obliques — controlling rotation, lateral flexion, and anti-rotation stability."
      ),
      muscle(
        "core",
        "lowerback",
        "LOWER BACK",
        "LOWER BACK",
        "Erector spinae and lumbar stabilizers — the foundation of safe, powerful lifting technique."
      ),
    ],
  },
];

export function regionPath(regionSlug) {
  return `/workouts/${regionSlug}`;
}

export function musclePath(regionSlug, muscleSlug) {
  return `/workouts/${regionSlug}/${muscleSlug}`;
}

// Both lookups return undefined for unknown slugs so the pages can fall back
// to NotFound instead of rendering an empty shell for a mistyped URL.
export function findRegion(regionSlug) {
  return REGIONS.find((region) => region.slug === regionSlug);
}

export function findMuscle(regionSlug, muscleSlug) {
  return findRegion(regionSlug)?.muscles.find((m) => m.slug === muscleSlug);
}
