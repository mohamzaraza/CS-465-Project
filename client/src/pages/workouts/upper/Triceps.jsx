import WorkoutInfoHeader from "../../../components/workouts/WorkoutInfoHeader";
import DifficultyNav from "../../../components/workouts/DifficultyNav";
import DifficultySection from "../../../components/workouts/DifficultySection";
import BackButton from "../../../components/workouts/BackButton";
import { useState } from "react";

export default function Triceps() {
  const [selected, setSelected] = useState("newcomer");

  return (
    <div className="min-h-screen bg-[#111] text-white py-32 px-6">

      {/* BACK BUTTON */}
      <BackButton to="/workouts/upper" />

      {/* TITLE + DESCRIPTION */}
      <WorkoutInfoHeader
        title="TRICEPS"
        description="Three heads — long, medial, and lateral — responsible for arm extension and upper arm stability."
      />

      {/* DIFFICULTY NAV */}
      <DifficultyNav selected={selected} onSelect={setSelected} />

      {/* TRUE SEPARATED SECTIONS */}
      <div id="difficulty-newcomer" className="pt-32">
        <DifficultySection difficulty="Newcomer" />
      </div>

      <div id="difficulty-warrior" className="pt-32">
        <DifficultySection difficulty="Warrior" />
      </div>

      <div id="difficulty-elite" className="pt-32">
        <DifficultySection difficulty="Elite" />
      </div>

      <div id="difficulty-logiccrafted" className="pt-32">
        <DifficultySection difficulty="LogicCrafted" />
      </div>

    </div>
  );
}