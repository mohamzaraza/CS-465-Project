export default function ExerciseCard({ name }) {
  return (
    <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-olympus-gold/30 
      shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      <h3 className="text-2xl font-display text-olympus-gold mb-3">
        {name}
      </h3>
      <p className="text-gray-400 text-sm">Exercise details will appear here.</p>
    </div>
  );
}