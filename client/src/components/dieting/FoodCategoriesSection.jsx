// src/components/dieting/FoodCategoriesSection.jsx

import proteinIcon from "../../assets/protein.png";
import carbsIcon from "../../assets/carbs.png";
import fatsIcon from "../../assets/fats.png";
import vegetablesIcon from "../../assets/vegetables.png";
import fruitsIcon from "../../assets/fruits.png";

export default function FoodCategoriesSection() {
  const categories = [
    {
      title: "High-Protein Foods",
      items: [
        "Chicken, turkey, lean beef",
        "Fish, tuna, salmon",
        "Eggs, egg whites",
        "Greek yogurt, cottage cheese",
        "Protein shakes"
      ],
      icon: proteinIcon,
    },
    {
      title: "Healthy Carbs",
      items: [
        "Rice, potatoes, pasta",
        "Oats, wholegrain bread",
        "Beans, lentils",
        "Fruits (especially berries)",
      ],
      icon: carbsIcon,
    },
    {
      title: "Healthy Fats",
      items: [
        "Olive oil, avocado",
        "Nuts & seeds",
        "Nut butters",
        "Fatty fish",
      ],
      icon: fatsIcon,
    },
    {
      title: "Vegetables",
      items: [
        "Leafy greens",
        "Broccoli, cauliflower",
        "Peppers, carrots",
        "Tomatoes, cucumbers",
      ],
      icon: vegetablesIcon,
    },
    {
      title: "Fruits",
      items: [
        "Bananas, apples",
        "Berries",
        "Oranges, kiwi",
        "Grapes (watch portions)",
      ],
      icon: fruitsIcon,
    },
  ];

  return (
    <div>
      <div className="w-full text-center text-olympus-gold text-2xl md:text-3xl font-display tracking-widest mb-10">
        ────══❖  FOOD CATEGORIES  ❖══────
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {categories.map((cat, idx) => (
          <div
            key={idx}
            className="
              group relative cursor-default
              rounded-2xl p-5
              bg-black/35 backdrop-blur-md
              border border-olympus-gold/30
              shadow-[0_0_20px_rgba(0,0,0,0.5)]
              hover:shadow-[0_0_35px_rgba(201,168,106,0.45)]
              transition-all duration-300
              hover:-translate-y-2
            "
          >
            {/* Icon */}
            {cat.icon && (
              <img
                src={cat.icon}
                alt=""
                className="w-10 h-10 mx-auto mb-3 opacity-80 group-hover:opacity-100 transition"
              />
            )}

            {/* Title */}
            <h3 className="text-center font-display text-olympus-gold text-lg mb-3 drop-shadow-md">
              {cat.title}
            </h3>

            {/* Divider */}
            <div className="w-12 mx-auto mb-3 h-[1px] bg-gradient-to-r from-transparent via-olympus-gold/50 to-transparent" />

            {/* Items */}
            <ul className="text-gray-300 text-xs space-y-1 leading-relaxed">
              {cat.items.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
