import { useState } from "react";

export default function FeatureCards() {
  const [openCards, setOpenCards] = useState([]);

  const toggleCard = (id) => {
    setOpenCards((prev) =>
      prev.includes(id)
        ? prev.filter((cardId) => cardId !== id)
        : [...prev, id]
    );
  };

  const cards = [
    {
      id: "train",
      title: "TRAIN",
      subtitle: "Workouts • Tutorials • Videos",
      description:
        "Develop power, precision, and mastery through structured routines designed for strength and hypertrophy.",
    },
    {
      id: "nourish",
      title: "NOURISH",
      subtitle: "Diet • Meal Plans • Calculator",
      description:
        "Fuel your transformation with balanced meals, macro guidance, and proper protein intake.",
    },
    {
      id: "transform",
      title: "TRANSFORM",
      subtitle: "AI Coach • Guidance",
      description:
        "Your personal Oracle. AI-powered coaching, program design, and insights crafted for your journey.",
    },
    {
      id: "compete",
      title: "COMPETE",
      subtitle: "PR • Metrics • Leaderboard",
      description:
        "Track strength, log PRs, compare stats, and rise through the ranks of disciplined warriors.",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
      {cards.map((card) => {
        const isOpen = openCards.includes(card.id);

        return (
          <div
            key={card.id}
            className="flex flex-col items-center gap-4"
          >
            {/* CARD */}
            <div
              onClick={() => toggleCard(card.id)}
              className={`
                relative w-full cursor-pointer
                bg-black/40 backdrop-blur-md rounded-2xl p-8
                border border-olympus-gold/25 
                shadow-[0_0_20px_rgba(0,0,0,0.5)]
                transition-all duration-500 transform
                hover:-translate-y-3
                ${
                  isOpen
                    ? "scale-[1.05] -translate-y-6 shadow-[0_0_40px_rgba(201,168,106,0.45)]"
                    : ""
                }
              `}
            >
              {/* TITLE */}
              <h3 className="relative text-3xl font-display text-olympus-gold text-center z-10 drop-shadow-md">
                {card.title}
              </h3>

              {/* SUBTITLE */}
              <p className="relative text-center text-gray-300 text-sm uppercase tracking-wide z-10 mt-1">
                {card.subtitle}
              </p>

              {/* EXPANDED TEXT */}
              {isOpen && (
                <p className="relative mt-6 text-gray-200 leading-relaxed text-center animate-fadeInSlow z-10">
                  {card.description}
                </p>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}