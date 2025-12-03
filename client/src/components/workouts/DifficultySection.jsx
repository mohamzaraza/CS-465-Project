import DifficultyBanner from "./DifficultyBanner";

export default function DifficultySection({ difficulty }) {
  return (
    <section className="py-20 border-t border-gray-700/40 mt-10">
      <DifficultyBanner
        title={difficulty}
        subtitle={`Exercises for ${difficulty} lifters`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto px-6">
        <p className="text-gray-500 text-center col-span-full">
          Exercises will go here.
        </p>
      </div>
      
    </section>
  );
}