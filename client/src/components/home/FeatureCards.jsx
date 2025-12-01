import { useState } from "react";
import Card from "../ui/Card";

export default function FeatureCards() {
  const [openCard, setOpenCard] = useState(null);

  const cards = [
    {
      id: "train",
      title: "TRAIN",
      subtitle: "Workouts • Tutorials • Videos",
      description:
        "Master your body with structured programs, exercise tutorials, hypertrophy training, strength routines, and cinematic workout videos designed to unlock your fullest potential.",
    },
    {
      id: "nourish",
      title: "NOURISH",
      subtitle: "Dieting • Meal Plans • Calculator",
      description:
        "Fuel your transformation with tailored nutrition tools, calorie calculations, meal plans, macro tracking, and guides built for long-term discipline and sustainable strength.",
    },
    {
      id: "transform",
      title: "TRANSFORM",
      subtitle: "AI Coach • Guidance • Advice",
      description:
        "Your personal fitness AI mentor — answer questions, design programs, optimize your routine, and guide you on the path from ordinary to exceptional.",
    },
    {
      id: "compete",
      title: "COMPETE",
      subtitle: "PR Tracker • Stats • Leaderboard",
      description:
        "Track personal records, compare your progress, analyze strength metrics, and rise through the ranks in a competitive environment forged for warriors.",
    },
  ];

  const toggleCard = (id) => {
    setOpenCard(prev => (prev === id ? null : id));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {cards.map((card) => (
        <div
          key={card.id}
          className="cursor-pointer transform transition-all duration-300 hover:scale-[1.03]"
          onClick={() => toggleCard(card.id)}
        >
          <Card
            className={`
              h-full flex flex-col justify-between
              ${openCard === card.id ? "shadow-[0_0_35px_rgba(201,168,106,0.45)] scale-[1.03]" : ""}
            `}
          >
            <h3 className="text-3xl font-display text-olympus-gold text-center mb-3">
              {card.title}
            </h3>

            <p className="text-center text-gray-300 text-sm uppercase tracking-wide">
              {card.subtitle}
            </p>

            {openCard === card.id && (
              <p className="mt-6 text-gray-200 leading-relaxed text-center animate-fadeInSlow">
                {card.description}
              </p>
            )}
          </Card>
        </div>
      ))}
    </div>
  );
}