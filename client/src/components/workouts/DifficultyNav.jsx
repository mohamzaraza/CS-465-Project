import tierColors from "./tierColors";

export default function DifficultyNav({ selected, onSelect }) {
  const tiers = [
    { id: "newcomer", label: "Newcomer" },
    { id: "warrior", label: "Warrior" },
    { id: "elite", label: "Elite" },
    { id: "logiccrafted", label: "LogicCrafted" },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-6 mt-10">
      {tiers.map((tier) => {
        const colors = tierColors[tier.id];
        const active = selected === tier.id;

        return (
          <button
            key={tier.id}
            onClick={() => {
              onSelect(tier.id);
              const section = document.getElementById(`difficulty-${tier.id}`);
              if (section) section.scrollIntoView({ behavior: "smooth" });
            }}
            className={`
              group relative px-8 py-3 rounded-xl 
              font-display text-xl tracking-wide
              transition-all duration-300 select-none

              shadow-md
              hover:shadow-[0_0_20px_var(--glow)] hover:scale-[1.05]

              ${active ? "scale-[1.08]" : ""}
            `}
            style={{
              "--glow": colors.glow,       // used by Tailwind at runtime
              border: `2px solid ${colors.border}`,
              background: `linear-gradient(145deg, ${colors.base}, ${colors.border})`,
              color: colors.text,
            }}
          >

            {/* PURE HOVER AURA */}
            <span
              className="
                absolute inset-0 rounded-xl
                opacity-0 group-hover:opacity-20
                transition-opacity duration-300
              "
              style={{
                background: `radial-gradient(circle, ${colors.glow} 25%, transparent 70%)`,
                mixBlendMode: "screen",
              }}
            />

            {tier.label}
          </button>
        );
      })}
    </div>
  );
}