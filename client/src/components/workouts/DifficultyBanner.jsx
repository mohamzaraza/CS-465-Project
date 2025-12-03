import tierColors from "./tierColors";

export default function DifficultyBanner({ title, subtitle }) {
  const tier = title.toLowerCase();
  const colors = tierColors[tier];

  return (
    <div className="relative w-full max-w-5xl mx-auto mb-16 px-6">

      {/* OUTER CONTAINER */}
      <div
        className="relative rounded-2xl p-[2px] shadow-xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.border}, ${colors.glow})`,
        }}
      >

        {/* INNER PANEL */}
        <div
          className="rounded-2xl py-10 px-6 text-center"
          style={{
            background: `linear-gradient(135deg, ${colors.base}, #000)`,
            border: `1px solid ${colors.border}`,
          }}
        >

          {/* TOP GREEK DIVIDER */}
          <div
            className="text-2xl font-display tracking-widest mb-6"
            style={{ color: colors.text }}
          >
            ────══❖  {title.toUpperCase()}  ❖══────
          </div>

          {/* ICON (optional: replace with your PNG/SVG later) */}
          <div className="flex justify-center mb-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-display"
              style={{
                background: `radial-gradient(circle, ${colors.border}, transparent 70%)`,
                boxShadow: `0 0 20px ${colors.glow}`,
                color: colors.text,
              }}
            >
              {/* TEMP ICON: Replace with your own */}
              ⚔️
            </div>
          </div>

          {/* TITLE */}
          <h2
            className="text-4xl font-display drop-shadow-lg"
            style={{
              color: colors.text,
              textShadow: `0 0 15px ${colors.glow}`,
            }}
          >
            {title}
          </h2>

          {/* SUBTITLE */}
          <p
            className="mt-3 opacity-80 font-body"
            style={{ color: colors.text }}
          >
            {subtitle}
          </p>

          {/* BOTTOM GREEK DIVIDER */}
          <div
            className="text-2xl font-display tracking-widest mt-6"
            style={{ color: colors.text }}
          >
            ────══❖  ❖══────
          </div>
        </div>
      </div>
    </div>
  );
}