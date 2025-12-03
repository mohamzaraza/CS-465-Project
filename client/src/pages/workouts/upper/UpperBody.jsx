import { Link } from "react-router-dom";
import BackButton from "../../../components/workouts/BackButton";

export default function UpperBody() {
  return (
    <div className="min-h-screen bg-[#111] text-white py-32 px-6">

      {/* BACK BUTTON */}
      <BackButton to="/workouts" />

      <h1 className="text-center text-5xl font-display text-olympus-gold mb-12">
        UPPER BODY
      </h1>

      <p className="text-center max-w-3xl mx-auto text-gray-300 text-lg mb-20">
        Build the frame: chest, shoulders, back, arms.  
        Choose a muscle group to begin your training path.
      </p>

      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10">

        <Link to="/workouts/upper/chest" className="workout-button">CHEST</Link>
        <Link to="/workouts/upper/shoulders" className="workout-button">SHOULDERS</Link>
        <Link to="/workouts/upper/back" className="workout-button">BACK</Link>
        <Link to="/workouts/upper/biceps" className="workout-button">BICEPS</Link>
        <Link to="/workouts/upper/triceps" className="workout-button">TRICEPS</Link>
        <Link to="/workouts/upper/forearm" className="workout-button">FOREARMS</Link>

      </div>

    </div>
  );
}