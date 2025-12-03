export default function WorkoutInfoHeader({ title, description }) {
  return (
    <div className="text-center mb-20 max-w-3xl mx-auto px-4">
      <h1 className="text-6xl font-display text-olympus-gold drop-shadow-[0_0_25px_rgba(201,168,106,0.5)] mb-6">
        {title}
      </h1>
      <p className="text-gray-300 text-lg leading-relaxed">
        {description}
      </p>
    </div>
  );
}