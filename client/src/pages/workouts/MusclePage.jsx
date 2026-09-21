import { useState } from "react";
import { useParams } from "react-router-dom";
import WorkoutInfoHeader from "../../components/workouts/WorkoutInfoHeader";
import DifficultyNav from "../../components/workouts/DifficultyNav";
import DifficultySection from "../../components/workouts/DifficultySection";
import BackButton from "../../components/workouts/BackButton";
import NotFound from "../NotFound";
import { findMuscle, regionPath } from "../../data/muscleGroups";
import { getExercisesForMuscle } from "../../data/exercises";

export default function MusclePage() {
  const { region, muscle: muscleSlug } = useParams();
  const [selectedTier, setSelectedTier] = useState("newcomer");

  const muscle = findMuscle(region, muscleSlug);
  if (!muscle) return <NotFound />;

  const exercises = getExercisesForMuscle(muscle.slug);

  return (
    <div className="min-h-screen bg-[#111] text-white py-32 px-6">

      {/* BACK BUTTON */}
      <BackButton to={regionPath(muscle.region)} />

      {/* TITLE + DESCRIPTION */}
      <WorkoutInfoHeader title={muscle.title} description={muscle.description} />

      {exercises.length === 0 ? (
        // The tier nav and four banners would only scroll between empty
        // sections, so a muscle without content gets one clear message instead.
        <div className="max-w-3xl mx-auto text-center bg-black/40 backdrop-blur-md border border-olympus-gold/30 rounded-2xl py-12 px-6">
          <p className="text-2xl font-display text-olympus-gold">
            Exercises for this muscle are coming soon
          </p>
          <p className="text-gray-400 mt-3">
            Check back later, or explore the other muscle groups in the meantime.
          </p>
        </div>
      ) : (
        <>
          {/* DIFFICULTY NAV */}
          <DifficultyNav selected={selectedTier} onSelect={setSelectedTier} />

          {/* ====== SECTIONS ====== */}
          <section id="difficulty-newcomer" className="pt-32">
            <DifficultySection difficulty="Newcomer" exercises={exercises} />
          </section>

          <section id="difficulty-warrior" className="pt-32">
            <DifficultySection difficulty="Warrior" exercises={exercises} />
          </section>

          <section id="difficulty-elite" className="pt-32">
            <DifficultySection difficulty="Elite" exercises={exercises} />
          </section>

          <section id="difficulty-logiccrafted" className="pt-32">
            <DifficultySection difficulty="LogicCrafted" exercises={exercises} />
          </section>
        </>
      )}

    </div>
  );
}
