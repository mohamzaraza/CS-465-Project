import { Link } from "react-router-dom";

export default function WorkoutsHome() {
  return (
    <div className="min-h-screen bg-[#111] text-white py-32 px-6">

      {/* Header Quote */}
      <h1 className="text-center text-5xl font-display text-olympus-gold drop-shadow-[0_0_20px_rgba(201,168,106,0.5)] mb-10">
        “THE BODY IS FORGED THROUGH RESISTANCE.”
      </h1>

      <p className="text-center max-w-3xl mx-auto text-gray-300 text-lg mb-20">
        To build muscle, you must tax the fibers, fuel the body with proper nutrition,
        and allow quality recovery. This is the eternal cycle of strength:
        **Stress → Fuel → Recover → Grow**.
      </p>

      {/* Category Buttons */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 mt-12">

        <Link
          to="/workouts/upper"
          className="bg-black/40 backdrop-blur-md border border-olympus-gold/40 rounded-2xl 
          py-12 text-center text-3xl font-display text-olympus-gold 
          hover:scale-105 hover:shadow-[0_0_35px_rgba(201,168,106,0.4)] transition-all duration-300">
          UPPER BODY
        </Link>

        <Link
          to="/workouts/lower"
          className="bg-black/40 backdrop-blur-md border border-olympus-gold/40 rounded-2xl 
          py-12 text-center text-3xl font-display text-olympus-gold 
          hover:scale-105 hover:shadow-[0_0_35px_rgba(201,168,106,0.4)] transition-all duration-300">
          LOWER BODY
        </Link>

        <Link
          to="/workouts/core"
          className="bg-black/40 backdrop-blur-md border border-olympus-gold/40 rounded-2xl 
          py-12 text-center text-3xl font-display text-olympus-gold 
          hover:scale-105 hover:shadow-[0_0_35px_rgba(201,168,106,0.4)] transition-all duration-300">
          CORE
        </Link>

      </div>

    </div>
  );
}