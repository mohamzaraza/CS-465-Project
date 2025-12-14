export default function Philosophy() {
  return (
    <section
      className="
        relative min-h-screen w-screen
        bg-temple bg-cover bg-center bg-fixed
        flex items-center justify-center
        text-gray-200
        overflow-hidden
      "
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/80 to-black/95" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-20 space-y-10 text-center">

        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-3">
            LIFTLOGIC PHILOSOPHY
          </p>
          <h1 className="text-3xl md:text-4xl font-display text-olympus-gold drop-shadow-[0_0_20px_rgba(201,168,106,0.55)]">
            Discipline Over Motivation
          </h1>
          <p className="mt-4 text-sm md:text-base text-gray-300 leading-relaxed">
            This platform isn&apos;t built around hype, trends, or shortcuts.
            It&apos;s built around the boring, unglamorous truth: you become what
            you repeatedly do — not what you occasionally feel like doing.
          </p>
        </div>

        {/* Core principles block */}
        <div
          className="
            bg-black/40 backdrop-blur-md
            border border-olympus-gold/30 rounded-2xl
            p-6 md:p-8 shadow-[0_0_25px_rgba(0,0,0,0.6)]
            text-left space-y-5
          "
        >
          <h2 className="text-lg md:text-xl font-display text-olympus-gold mb-2 text-center">
            The Core Pillars
          </h2>

          <ul className="space-y-3 text-sm md:text-base text-gray-200">
            <li>
              <span className="font-semibold text-olympus-gold">Clarity over noise.</span>{" "}
              You don&apos;t need a hundred tips — you need a few principles you
              actually follow. LiftLogic exists to strip things down to what matters.
            </li>
            <li>
              <span className="font-semibold text-olympus-gold">Systems over willpower.</span>{" "}
              Calorie targets, structured meals, simple training plans — these
              are systems that make discipline easier than chaos.
            </li>
            <li>
              <span className="font-semibold text-olympus-gold">Evidence over superstition.</span>{" "}
              We lean on realistic ranges, not magic numbers or extreme promises.
              Progress should make sense when you look at it.
            </li>
            <li>
              <span className="font-semibold text-olympus-gold">Consistency over intensity.</span>{" "}
              A good week doesn&apos;t matter if it&apos;s followed by three bad ones.
              The goal is something you can sustain for months, not days.
            </li>
          </ul>
        </div>

        {/* Closing line */}
        <p className="text-xs md:text-sm text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Every tool in LiftLogic — from the calorie calculator to the dieting
          guide — is built around this philosophy: give you enough structure to
          remove guesswork, and enough freedom to make it your own.
        </p>
      </div>
    </section>
  );
}
