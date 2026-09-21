// src/components/workouts/DifficultySection.jsx

import DifficultyBanner from "./DifficultyBanner";
import ExerciseCard from "./ExerciseCard";

// The page passes in its own muscle's exercises; importing a data file here
// is what made every muscle page show the chest exercises.
export default function DifficultySection({ difficulty, exercises: allExercises = [] }) {
  // "Newcomer" -> "newcomer"
  const tier = (difficulty || "").toLowerCase();

  // Filter exercises for this tier
  const exercises = allExercises.filter((ex) => ex.tier === tier);

  return (
    <section className="py-20 border-t border-gray-700/40 mt-10">
      {/* Banner */}
      <DifficultyBanner
        title={difficulty}
        subtitle={`Exercises for ${difficulty} lifters`}
      />

      {/* Exercises grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto px-6">
        {exercises.length === 0 ? (
          <p className="text-gray-500 text-center col-span-full">
            No exercises added for this tier yet.
          </p>
        ) : (
          exercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))
        )}
      </div>
    </section>
  );
}
