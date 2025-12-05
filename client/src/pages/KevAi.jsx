import KevAiChat from "../components/kevai/KevAiChat"; 

export default function KevAi() {
  return (
    <div className="min-h-screen w-full bg-[#111] text-white pt-32 pb-20 px-4">

      {/* Title */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-display text-olympus-gold drop-shadow-[0_0_25px_rgba(201,168,106,0.5)]">
          KevAi
        </h1>
        <p className="text-gray-300 mt-4 text-lg max-w-2xl mx-auto">
          Your personal Oracle. Ask anything about training, nutrition, recovery,
          programming, or mindset.
        </p>
      </div>

      {/* Chat Window */}
      <div className="max-w-4xl mx-auto">
        <KevAiChat />
      </div>

    </div>
  );
}
