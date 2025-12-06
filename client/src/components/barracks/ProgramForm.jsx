import { useState } from "react";

export default function ProgramForm({ onGenerate }) {
  const [frequency, setFrequency] = useState(3);
  const [goal, setGoal] = useState("hypertrophy");
  const [experience, setExperience] = useState("newcomer");

  function handleSubmit(e) {
    e.preventDefault();

    const data = {
      frequency: Number(frequency),
      goal,
      experience,
    };

    onGenerate(data);
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-gray-700/40"
    >
      {/* Frequency */}
      <label className="block mb-4">
        <span className="text-olympus-gold font-display">Days per week</span>
        <select
          className="w-full mt-2 p-3 bg-black/70 border border-gray-600 rounded-lg"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
        >
          {[2,3,4,5,6].map((num) => (
            <option key={num} value={num}>{num} days</option>
          ))}
        </select>
      </label>

      {/* Goal */}
      <label className="block mb-4">
        <span className="text-olympus-gold font-display">Primary Goal</span>
        <select
          className="w-full mt-2 p-3 bg-black/70 border border-gray-600 rounded-lg"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        >
          <option value="strength">Strength</option>
          <option value="hypertrophy">Hypertrophy</option>
          <option value="recomp">Recomposition</option>
          <option value="fatloss">Fat Loss</option>
        </select>
      </label>

      {/* Experience */}
      <label className="block mb-8">
        <span className="text-olympus-gold font-display">Experience Level</span>
        <select
          className="w-full mt-2 p-3 bg-black/70 border border-gray-600 rounded-lg"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
        >
          <option value="newcomer">Newcomer</option>
          <option value="warrior">Warrior</option>
          <option value="elite">Elite</option>
        </select>
      </label>

      <button
        type="submit"
        className="w-full mt-4 py-3 bg-olympus-gold text-olympus-black font-display rounded-lg hover:scale-105 transition-all"
      >
        Forge My Split
      </button>
    </form>
  );
}
