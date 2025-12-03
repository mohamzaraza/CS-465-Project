import { Link } from "react-router-dom";
import BackButton from "../../../components/workouts/BackButton";

export default function LowerBody() {
  return (
    <div className="min-h-screen bg-[#111] text-white py-32 px-6">

      {/* BACK BUTTON */}
      <BackButton to="/workouts" />

      <h1 className="text-center text-5xl font-display text-olympus-gold mb-12">
        LOWER BODY
      </h1>

      <p className="text-center max-w-3xl mx-auto text-gray-300 text-lg mb-20">
        The lower body houses your strongest muscle groups — driving power,
        stability, and athletic performance. Build a foundation that supports
        every lift and every movement.
      </p>

      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-10 mt-12">

        <Link to="/workouts/lower/quads" className="workout-button">QUADS</Link>
        <Link to="/workouts/lower/hamstrings" className="workout-button">HAMSTRINGS</Link>
        <Link to="/workouts/lower/glutes" className="workout-button">GLUTES</Link>
        <Link to="/workouts/lower/calves" className="workout-button">CALVES</Link>

      </div>

    </div>
  );
}