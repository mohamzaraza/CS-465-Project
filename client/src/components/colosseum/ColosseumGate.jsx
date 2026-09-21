import { useEffect, useState, useRef } from "react";
import ColosseumPage from "../../pages/colosseum/ColosseumPage";
import colosseumIntro from "../../assets/colosseum/ArenaCutscene.mov";
import RankChestPanel from "./RankChestPanel";

export default function ColosseumGate() {
  // Read the flag during the first render so the right step shows immediately,
  // instead of rendering nothing and correcting it from an effect.
  const [step, setStep] = useState(() =>
    localStorage.getItem("ArenaCutscene.mov_seen") ? "warning" : "cinematic"
  );
  const videoRef = useRef(null);

  // Alt+R replays the intro while developing; production builds must not
  // intercept keys, so the listener is never registered there.
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const handler = (e) => {
      if (e.altKey && e.key.toLowerCase() === "r") {
        localStorage.removeItem("ArenaCutscene.mov_seen");
        window.location.reload();
      }
    };

    document.addEventListener("keydown", handler, { capture: true });

    return () => document.removeEventListener("keydown", handler, { capture: true });
  }, []);


  // After cinematic ends
  function handleCinematicEnd() {
    localStorage.setItem("ArenaCutscene.mov_seen", "true");
    setStep("warning");
  }

  // After user accepts the code of honor
  function handleAcceptWarning() {
    setStep("colosseum");
  }

  /* -------------------------------
      STEP 1 — CINEMATIC INTRO
  --------------------------------*/
  if (step === "cinematic") {
    return (

        
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        
        <video
          ref={videoRef}
          src={colosseumIntro}
          autoPlay
          className="w-full h-full object-cover"
          onEnded={handleCinematicEnd}
        />

        {/* Optional Skip Button */}
        <button
          onClick={handleCinematicEnd}
          className="absolute bottom-10 right-10 px-6 py-3 bg-black/70 text-white 
                     border border-red-600 rounded-lg hover:bg-red-700/60 transition-all"
        >
          Skip
        </button>
      </div>
    );
  }

  /* -------------------------------
      STEP 2 — ARENA HONOR WARNING
  --------------------------------*/
  if (step === "warning") {
    return (
      <div className="fixed inset-0 bg-[#0c0c0c] text-white flex flex-col items-center justify-center px-10 text-center">

        <h1 className="text-6xl font-display mb-8 text-red-600 drop-shadow-[0_0_35px_rgba(255,0,0,0.5)]">
          THE COLOSSEUM
        </h1>

        <p className="max-w-3xl text-lg leading-relaxed mb-12 text-gray-300">
          <span className="text-red-400 font-bold">Strength</span> reveals truth. Illusion reveals nothing.<br /><br />
          Forge your numbers with <span className="text-red-400 font-bold">honesty</span>, not ego.<br />
          A lie lifts nothing. A lie grows nothing. A lie conquers nothing.<br /><br />
          Enter only if you accept the terms of discipline and integrity.
        </p>

        <button
          onClick={handleAcceptWarning}
          className="mt-6 px-10 py-4 bg-red-600 text-black font-display 
                     rounded-xl text-xl hover:scale-105 transition-all shadow-[0_0_25px_rgba(255,0,0,0.6)]"
        >
          Enter the Arena
        </button>
      </div>
    );
  }

  /* -------------------------------
      STEP 3 — ACTUAL COLOSSEUM PAGE
  --------------------------------*/
  return <ColosseumPage />;
}
