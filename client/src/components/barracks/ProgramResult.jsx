export default function ProgramResult({ program, onReset }) {
  return (
    <div className="max-w-3xl mx-auto mt-12">
      <h2 className="text-4xl font-display text-olympus-gold mb-4">
        Your Training Split
      </h2>

      <pre className="bg-black/40 p-6 rounded-xl border border-gray-700">
        {JSON.stringify(program, null, 2)}
      </pre>

      <button
        onClick={onReset}
        className="mt-6 px-6 py-3 bg-olympus-gold text-black rounded-xl hover:scale-105 transition"
      >
        Build Another Split
      </button>
    </div>
  );
}
