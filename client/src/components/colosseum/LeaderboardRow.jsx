import colosseumTiers from "../../config/colosseumTiers";
import colosseumMastery from "../../config/colosseumMastery"

export default function LeaderboardRow({ user, rank }) {
  // Normalize tier key (capitalize first letter)
  const tierKey =
    user.tier.charAt(0).toUpperCase() + user.tier.slice(1).toLowerCase();

  const tier = colosseumTiers[tierKey];
  const mastery = colosseumMastery[user.mastery]; // ★★★ HERE

  // Fail-safe for undefined tiers
  if (!tier) {
    console.error("Unknown tier:", user.tier);
    return (
      <div className="p-6 rounded-xl bg-red-900 text-white">
        ERROR: Unknown tier "{user.tier}"
      </div>
    );
  }

  // Pick solid or gradient plate automatically
  const plateStyle =
    tier.plateType === "gradient"
      ? { background: tier.gradient }
      : { backgroundColor: tier.plate };

  // ICONS FOR #1 #2 #3
  const specialIcon =
    rank === 1
      ? "/src/assets/colosseum/Crown.png"
      : rank === 2
      ? "/src/assets/colosseum/Helmetg.png"
      : rank === 3
      ? "/src/assets/colosseum/Warriorr.png"
      : null;

  return (
    <div
      className="
        p-5 rounded-2xl bg-black/40 backdrop-blur-md
        border border-red-700/40
        shadow-[0_0_35px_rgba(255,0,0,0.25)]
        flex items-center gap-6
      "
    >
      {/* RANK + ICON */}
      <div className="flex flex-col items-center w-20">
        <span className="text-5xl font-display text-red-500">{rank}</span>

        {specialIcon && (
          <img
            src={specialIcon}
            className="
              w-12 h-12 mt-2 object-contain
              drop-shadow-[0_0_12px_rgba(255,0,0,0.6)]
            "
          />
        )}
      </div>

      {/* USER INFO BLOCK */}
      <div className="flex flex-col flex-1">

        {/* PLATE */}
        <div
          className="
            w-full px-5 py-3 rounded-lg shadow-lg
            flex items-center justify-between
          "
          style={{
            ...plateStyle,
            border: `2px solid ${tier.border}`,
            boxShadow: `0 0 15px ${tier.glow}`,
          }}
        >
          <span
            className="text-2xl font-display font-bold"
            style={{ color: tier.text }}
          >
            {user.name}
          </span>

          <span
            className="text-sm px-3 py-1 rounded-md border font-bold tracking-wide"
            style={{
              color: tier.text,
              borderColor: tier.text + "55",
            }}
          >
            {tierKey}
          </span>
        </div>

              {/* MASTERY STARS */}
              <div className="flex gap-1 mt-2">
                {Array.from({ length: mastery.stars }).map((_, idx) => (
                  <span key={idx} className="text-yellow-300 text-xl drop-shadow-md">
                    ★
                  </span>
                ))}
              </div>

              {/* OPTIONAL LABEL */}
              <p style={{ color: mastery.color, fontSize: "0.9rem" }}>
                {mastery.label}
              </p>

        {/* TOTAL STRENGTH */}
        <p className="mt-2 text-red-400 font-bold text-xl">
          {user.total} lb Total
        </p>
      </div>
    </div>
  );
}
