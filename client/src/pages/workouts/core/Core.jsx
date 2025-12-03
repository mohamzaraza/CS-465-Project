import { Link } from "react-router-dom";
import BackButton from "../../../components/workouts/BackButton";

export default function Core() {
  return (
    <div className="min-h-screen bg-[#111] text-white py-32 px-6">

      {/* BACK BUTTON */}
      <BackButton to="/workouts" />

      <h1 className="text-center text-5xl font-display text-olympus-gold mb-12">
        CORE
      </h1>

      <p className="text-center max-w-3xl mx-auto text-gray-300 text-lg mb-20">
        The core is the body’s stabilizing engine — supporting posture, protecting
        the spine, and generating strength through every movement.
      </p>

      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 mt-12">

        <Link to="/workouts/core/abs" className="workout-button">ABS</Link>
        <Link to="/workouts/core/obliques" className="workout-button">OBLIQUES</Link>
        <Link to="/workouts/core/lowerback" className="workout-button">LOWER BACK</Link>

      </div>

    </div>
  );
}