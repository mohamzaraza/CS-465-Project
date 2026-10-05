// One page serves every /workouts/:region/:muscle URL from data/muscleGroups.js.
// It replaces 13 copied pages that had drifted apart (all of them showed chest
// exercises), so a fix or a new muscle now lands in one place.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import WorkoutInfoHeader from "../../components/workouts/WorkoutInfoHeader";
import DifficultyNav from "../../components/workouts/DifficultyNav";
import DifficultySection from "../../components/workouts/DifficultySection";
import BackButton from "../../components/workouts/BackButton";
import NotFound from "../NotFound";
import { findMuscle, regionPath } from "../../data/muscleGroups";
import { apiRequest } from "../../lib/api";

// The server stores a video's file name; only the client knows its base path
// ("/" in dev, "/CS-465-Project/" on GitHub Pages), where public/ is served.
function withVideoUrl({ videoFile, ...exercise }) {
  return {
    ...exercise,
    video: videoFile ? `${import.meta.env.BASE_URL}videos/${videoFile}` : undefined,
  };
}

export default function MusclePage() {
  const { region, muscle: muscleSlug } = useParams();
  const [selectedTier, setSelectedTier] = useState("newcomer");
  // Tagged with the muscle it belongs to: moving between muscle pages keeps
  // this component mounted, so an answer for another muscle is "still loading".
  const [loaded, setLoaded] = useState({ muscle: null, exercises: null, error: null });
  const [attempt, setAttempt] = useState(0);

  const muscle = findMuscle(region, muscleSlug);
  const muscleEnum = muscle?.muscle;

  useEffect(() => {
    if (!muscleEnum) return undefined;
    // Ignores an answer that arrives after the user has moved to another muscle.
    let current = true;
    apiRequest(`/exercises?muscle=${muscleEnum}`)
      .then((data) => {
        if (current) setLoaded({ muscle: muscleEnum, exercises: data.map(withVideoUrl), error: null });
      })
      .catch((err) => {
        // Without a visible error, a failed request looks exactly like a
        // muscle with no exercises ("coming soon").
        console.error(err);
        if (current) setLoaded({ muscle: muscleEnum, exercises: null, error: err });
      });
    return () => {
      current = false;
    };
  }, [muscleEnum, attempt]);

  if (!muscle) return <NotFound />;

  const isLoaded = loaded.muscle === muscleEnum;
  const error = isLoaded ? loaded.error : null;
  const exercises = isLoaded ? loaded.exercises : null;

  function handleRetry() {
    setLoaded({ muscle: null, exercises: null, error: null });
    setAttempt((n) => n + 1);
  }

  return (
    <div className="min-h-screen bg-[#111] text-white py-32 px-6">

      {/* BACK BUTTON */}
      <BackButton to={regionPath(muscle.region)} />

      {/* TITLE + DESCRIPTION */}
      <WorkoutInfoHeader title={muscle.title} description={muscle.description} />

      {error ? (
        <div className="max-w-3xl mx-auto bg-black/40 border border-red-800/40 rounded-2xl p-6 text-center">
          <p role="alert" className="text-red-400 mb-4">{error.message}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-red-600 text-black font-display rounded hover:scale-105 transition"
          >
            Retry
          </button>
        </div>
      ) : !exercises ? (
        <p role="status" className="text-center text-gray-400">
          Loading...
        </p>
      ) : exercises.length === 0 ? (
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
