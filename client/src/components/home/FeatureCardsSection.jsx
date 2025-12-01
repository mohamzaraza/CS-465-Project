import FeatureCards from "./FeatureCards";

export default function FeatureCardsSection() {
  return (
    <section
      className="relative py-32 
      bg-[url('/src/assets/dark-marble.jpg')]
      bg-cover bg-center bg-fixed text-white"
    >

      {/* Fade INTO marble (matches the hero fade) */}
      <div className="absolute top-0 left-0 w-full h-40 
        bg-gradient-to-t from-transparent to-[#111]">
      </div>

      {/* Fade OUT into dark (Bottom Part) */}
      <div className="absolute bottom-0 left-0 w-full h-40 
          bg-gradient-to-b from-transparent to-[#111]">
      </div>

      {/* TOP GREEK BORDER */}
      <div className="w-full text-center text-olympus-gold text-3xl 
        font-display tracking-widest mb-16">
        ────══❖  SILVER MEANDER BORDER  ❖══────
      </div>

      {/* SECTION TITLE */}
      <div className="text-center mb-20 px-4 animate-fadeInSlow">
        <h2 className="text-5xl font-display text-olympus-gold 
          drop-shadow-[0_0_15px_rgba(201,168,106,0.45)]">
          Your Transformation Begins Here
        </h2>

        <p className="mt-6 text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
          Four disciplines forged for warriors. Choose the path that shapes your destiny.
        </p>
      </div>

      {/* CARDS */}
      <div className="max-w-6xl mx-auto px-6">
        <FeatureCards />
      </div>

      {/* BOTTOM BORDER */}
      <div className="w-full text-center text-olympus-gold text-3xl 
        font-display tracking-widest mt-20">
        ────══❖  SILVER MEANDER BORDER  ❖══────
      </div>

    </section>
  );
}