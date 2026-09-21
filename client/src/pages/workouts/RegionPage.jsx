import { Link, useParams } from "react-router-dom";
import BackButton from "../../components/workouts/BackButton";
import NotFound from "../NotFound";
import { findRegion, musclePath } from "../../data/muscleGroups";

export default function RegionPage() {
  const { region: regionSlug } = useParams();

  const region = findRegion(regionSlug);
  if (!region) return <NotFound />;

  return (
    <div className="min-h-screen bg-[#111] text-white py-32 px-6">

      {/* BACK BUTTON */}
      <BackButton to="/workouts" />

      <h1 className="text-center text-5xl font-display text-olympus-gold mb-12">
        {region.title}
      </h1>

      <p className="text-center max-w-3xl mx-auto text-gray-300 text-lg mb-20">
        {region.intro}
      </p>

      <div className={region.gridClassName}>
        {region.muscles.map((muscle) => (
          <Link
            key={muscle.slug}
            to={musclePath(region.slug, muscle.slug)}
            className="workout-button"
          >
            {muscle.linkLabel}
          </Link>
        ))}
      </div>

    </div>
  );
}
