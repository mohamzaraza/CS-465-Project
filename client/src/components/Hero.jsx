import FadeIn from "./ui/FadeIn";
import Button from "./ui/Button";

export default function Hero() {
  return (
    <section className="
      h-screen w-full 
      bg-hero-olympus bg-cover bg-center bg-no-repeat 
      relative flex items-center justify-center
    ">
      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]"></div>

      {/* CONTENT */}
      <div className="relative z-10 text-center max-w-4xl px-6">

        {/* HEADLINE */}
        <FadeIn>
          <h1 className="
            text-5xl md:text-7xl font-display 
            text-olympus-gold tracking-[0.15em]
            drop-shadow-[0_0_25px_rgba(255,215,0,0.45)]
          ">
            RISE TO YOUR FINAL FORM
          </h1>
        </FadeIn>

        {/* SUBTITLE */}
        <FadeIn delay={0.3}>
          <p className="
            text-gray-200 font-body text-xl md:text-2xl 
            mt-8 max-w-2xl mx-auto
            leading-relaxed
          ">
            “The body becomes strong, but the will becomes unbreakable.
            Discipline is the true forge of gods.”
          </p>
        </FadeIn>

        {/* BUTTON */}
        <FadeIn delay={0.6}>
          <div className="mt-12">
            <Button 
              onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
            >
              BEGIN YOUR ASCENT
            </Button>
          </div>
        </FadeIn>

      </div>

      {/* OPTIONAL GOLD GLOW LAYER */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80"></div>
    </section>
  );
}