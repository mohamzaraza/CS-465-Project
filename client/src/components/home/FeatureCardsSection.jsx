import FeatureCards from "./FeatureCards";
import logo from "../../assets/logo.svg";

export default function FeatureCardsSection() {
  return (
    <section className="
      relative py-32 
      bg-[url('/src/assets/dark-marble.jpg')] bg-cover bg-center bg-fixed 
      text-white
    ">

      {/* Fade into marble */}
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-t from-transparent to-[#111]"></div>

      {/* Fade Lower */}
      <div className="absolute bottom-0 left-0 w-full h-40 
          bg-gradient-to-b from-transparent to-[#111]" />

      {/* LiftLogic Crest */}
      <div className="flex justify-center mb-12">
        <img
          src={logo}
          alt="LiftLogic Logo"
          className="w-36 opacity-95 drop-shadow-[0_0_35px_rgba(201,168,106,0.55)] animate-pulse"
        />
      </div>

      {/* Greek Border Top */}
      <div className="w-full text-center text-olympus-gold text-3xl font-display tracking-widest mb-14">
        ────══❖  LIFTLOGIC DISCIPLINES  ❖══────
      </div>

      {/* Header */}
      <div className="text-center mb-20 px-4">
        <h2 className="text-5xl font-display text-olympus-gold drop-shadow-[0_0_15px_rgba(201,168,106,0.45)]">
          Choose Your Path
        </h2>
        <p className="mt-6 text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
          Four disciplines forged for warriors. Tap into the foundations of every transformation.
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-6xl mx-auto px-6">
        <FeatureCards />
      </div>

      {/* Greek Border Bottom */}
      <div className="w-full text-center text-olympus-gold text-3xl font-display tracking-widest mt-20">
        ────══❖  LIFTLOGIC DISCIPLINES  ❖══────
      </div>

    </section>
  );
}