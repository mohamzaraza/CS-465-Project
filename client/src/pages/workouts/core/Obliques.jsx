import WorkoutInfoHeader from "../../../components/workouts/WorkoutInfoHeader";
import DifficultyNav from "../../../components/workouts/DifficultyNav";
import DifficultySection from "../../../components/workouts/DifficultySection";
import BackButton from "../../../components/workouts/BackButton";
import { useState } from "react";

export default function Obliques() {
  const [selectedTier, setSelectedTier] = useState("newcomer");

  return (
    <div className="min-h-screen bg-[#111] text-white py-32 px-6">

      {/* BACK BUTTON */}
      <BackButton to="/workouts/core" />

      {/* TITLE + DESCRIPTION */}
      <WorkoutInfoHeader
        title="OBLIQUES"
        description="Internal and external obliques — controlling rotation, lateral flexion, and anti-rotation stability."
      />

      {/* DIFFICULTY NAV */}
      <DifficultyNav selected={selectedTier} onSelect={setSelectedTier} />

      {/* ====== SECTIONS ====== */}
      <section id="difficulty-newcomer" className="pt-32">
        <DifficultySection difficulty="Newcomer" />
      </section>

      <section id="difficulty-warrior" className="pt-32">
        <DifficultySection difficulty="Warrior" />
      </section>

      <section id="difficulty-elite" className="pt-32">
        <DifficultySection difficulty="Elite" />
      </section>

      <section id="difficulty-logiccrafted" className="pt-32">
        <DifficultySection difficulty="LogicCrafted" />
      </section>

    </div>
  );
}