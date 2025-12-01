import FeatureCardsSection from "../components/home/FeatureCardsSection";
import PillarsSection from "../components/home/PillarSection";

export default function Home() {
  return (
    <div className="w-screen overflow-x-hidden">

      {/* ================= HERO SECTION ================= */}
      <section
        className="relative min-h-screen w-screen
        bg-[url('/src/assets/homebg.jpg')]
        bg-center bg-no-repeat bg-cover
        flex items-center justify-center"
      >

        {/* Fade OUT into dark */}
        <div className="absolute bottom-0 left-0 w-full h-40 
          bg-gradient-to-b from-transparent to-[#111]">
        </div>

        {/* Hero Content */}
        <div className="relative text-center px-4">
          <h1 className="text-titan font-display text-olympus-gold greek-glow 
            drop-shadow-[0_0_20px_rgba(201,168,106,0.6)]
            animate-fadeInSlow">
            FORGE YOUR LEGEND
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-gray-200 font-body text-lg 
            leading-relaxed animate-fadeInSlow delay-[400ms]">
            Strength is built in the shadows. Discipline carves the path.
            Welcome to a new era of transformation.
          </p>
        </div>

      </section>
      {/* ================= END HERO ================= */}


      {/* SECTION 2: FEATURE CARDS */}
      <FeatureCardsSection />

      {/* ================= MAIN CONTENT PLACEHOLDER ================= */}
      <PillarsSection />


    </div>
  );
}