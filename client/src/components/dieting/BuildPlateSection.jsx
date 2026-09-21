// src/components/dieting/BuildPlateSection.jsx

import { useState, useMemo } from "react";
import {
  FOOD_DATA,
  FOOD_CATEGORIES,
  computeTotals,
  getPlateFeedback,
} from "../../utils/dietingUtils";

const MAX_PER_ITEM = 5;
const MAX_TOTAL_ITEMS = 15;

export default function BuildPlateSection() {
  const [selectedCategory, setSelectedCategory] = useState("protein");
  const [plate, setPlate] = useState([]);
  const [addError, setAddError] = useState("");

  const filteredFoods = useMemo(
    () => FOOD_DATA.filter((food) => food.category === selectedCategory),
    [selectedCategory]
  );

  const totals = useMemo(() => computeTotals(plate), [plate]);
  const feedbackMessages = useMemo(
    () => getPlateFeedback(plate, totals),
    [plate, totals]
  );

  // Group plate items by id to show duplicates as "xN"
  const groupedPlate = useMemo(() => {
    const map = {};
    for (const food of plate) {
      if (!map[food.id]) {
        map[food.id] = { ...food, count: 0 };
      }
      map[food.id].count += 1;
    }
    return Object.values(map);
  }, [plate]);

  const handleAddToPlate = (food) => {
    setAddError("");

    // Total plate limit
    if (plate.length >= MAX_TOTAL_ITEMS) {
      setAddError(
        `Your plate is full. Try removing something or keeping meals simpler. (Max ${MAX_TOTAL_ITEMS} items)`
      );
      return;
    }

    // Per-item limit
    const currentCount = plate.filter((item) => item.id === food.id).length;
    if (currentCount >= MAX_PER_ITEM) {
      setAddError(
        `You’ve already added ${MAX_PER_ITEM} portions of ${food.name}. Add some variety instead.`
      );
      return;
    }

    setPlate((prev) => [...prev, food]);
  };

  const handleClearPlate = () => {
    setPlate([]);
    setAddError("");
  };

  // Remove ONE instance of a food by id
  const handleRemoveOne = (foodId) => {
    setPlate((prev) => {
      const index = prev.findIndex((item) => item.id === foodId);
      if (index === -1) return prev;
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
    setAddError("");
  };

  return (
    <div
      className="
        rounded-2xl border border-olympus-gold/50
        bg-black/35 backdrop-blur-sm
        shadow-[0_0_30px_rgba(0,0,0,0.7)]
        p-4 md:p-6
      "
    >
      <div className="w-full text-center text-olympus-gold text-2xl md:text-3xl font-display tracking-widest mb-6">
        ────══❖  BUILD YOUR PLATE  ❖══────
      </div>

      <p className="text-sm text-gray-300 mb-4 text-center max-w-2xl mx-auto">
        Build a realistic meal by combining proteins, carbs, fats, and plants.
        Portions are limited so you don&apos;t stack 20 of the same food.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* ================= LEFT: CATEGORIES + FOOD LIST ================= */}
        <div className="space-y-4">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {FOOD_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setAddError("");
                }}
                className={`
                  text-xs md:text-sm px-3 py-1.5 rounded-full border
                  font-body
                  ${
                    selectedCategory === cat.id
                      ? "bg-olympus-gold text-black border-olympus-gold shadow-gold-glow"
                      : "border-gray-500/70 text-gray-200 hover:bg-white/5"
                  }
                  transition
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Food options list */}
          <div className="bg-black/40 rounded-xl border border-[#ffffff14] p-3 max-h-64 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-100 mb-2">
              {FOOD_CATEGORIES.find((c) => c.id === selectedCategory)?.label}{" "}
              Options
            </h3>
            {filteredFoods.length === 0 ? (
              <p className="text-xs text-gray-400">
                No foods available in this category yet.
              </p>
            ) : (
              <ul className="space-y-2 text-xs text-gray-200">
                {filteredFoods.map((food) => (
                  <li
                    key={food.id}
                    className="flex items-center justify-between gap-2 border-b border-white/5 pb-1"
                  >
                    <div>
                      <p className="font-semibold text-gray-100">
                        {food.name}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {food.calories} kcal · {food.protein}g P ·{" "}
                        {food.carbs}g C · {food.fats}g F
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddToPlate(food)}
                      className="
                        text-[11px] px-2 py-1 rounded-full
                        bg-olympus-gold text-black font-semibold
                        hover:bg-olympus-goldlight
                        transition
                      "
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {addError && (
            <p className="text-[11px] text-red-400 mt-1">
              {addError}
            </p>
          )}
        </div>

        {/* ================= RIGHT: PLATE VISUAL (TEXT INSIDE) + TOTALS + FEEDBACK ================= */}
        <div className="space-y-4">
          {/* Plate + Clear button */}
          <div
            className="
              bg-black/40 rounded-xl border border-[#ffffff1a]
              p-4 flex flex-col items-center gap-3
              relative overflow-hidden
              shadow-[0_0_18px_rgba(0,0,0,0.6)]
            "
          >
            <div className="flex w-full items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-100">
                Your Plate
              </h3>
              <button
                type="button"
                onClick={handleClearPlate}
                className="
                  text-[11px] px-3 py-1 rounded-full
                  border border-gray-500/70 text-gray-200
                  hover:bg-white/5
                  transition
                "
              >
                Clear Plate
              </button>
            </div>

            {/* Plate graphic with text list inside */}
            <div className="relative w-full max-w-xs aspect-square mx-auto mt-1">
              {/* Plate PNG */}
              <div
                className="
                  absolute inset-0
                  bg-[url('/src/assets/plate.png')]
                  bg-contain bg-center bg-no-repeat
                  opacity-90
                "
              />

              {/* Text-only grouped list inside plate */}
              <div
                className="
                  absolute inset-8
                  flex flex-col gap-1
                  overflow-y-auto
                  text-[11px] md:text-xs
                "
              >
                {groupedPlate.length === 0 ? (
                  <p className="text-gray-400 text-center px-4">
                    No foods added yet. Select items from the left and add them
                    to your plate.
                  </p>
                ) : (
                  groupedPlate.map((item) => {
                    const totalCalories = item.calories * item.count;
                    const totalProtein = item.protein * item.count;
                    const totalCarbs = item.carbs * item.count;
                    const totalFats = item.fats * item.count;

                    return (
                      <div
                        key={item.id}
                        className="
                          flex items-center justify-between gap-2
                          bg-black/70
                          border border-olympus-gold/40
                          rounded-full
                          px-2 py-1
                        "
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-100 truncate">
                            {item.name}{" "}
                            {item.count > 1 && (
                              <span className="text-olympus-gold text-[10px]">
                                ×{item.count}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {totalCalories.toFixed(0)} kcal ·{" "}
                            {totalProtein.toFixed(1)}P /{" "}
                            {totalCarbs.toFixed(1)}C /{" "}
                            {totalFats.toFixed(1)}F
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOne(item.id)}
                          className="
                            flex items-center justify-center
                            w-5 h-5
                            rounded-full
                            border border-red-400/70
                            text-red-300
                            text-[11px]
                            hover:bg-red-500/20
                            transition
                          "
                          aria-label="Remove one portion"
                        >
                          −
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-black/40 rounded-xl border border-[#ffffff1a] p-3 text-xs text-gray-200">
            <h4 className="font-semibold text-gray-100 mb-1">
              Plate Totals
            </h4>
            <p>
              Calories:{" "}
              <span className="font-semibold">
                {totals.calories.toFixed(0)} kcal
              </span>
            </p>
            <p>
              Protein:{" "}
              <span className="font-semibold">
                {totals.protein.toFixed(1)} g
              </span>
            </p>
            <p>
              Carbs:{" "}
              <span className="font-semibold">
                {totals.carbs.toFixed(1)} g
              </span>
            </p>
            <p>
              Fats:{" "}
              <span className="font-semibold">
                {totals.fats.toFixed(1)} g
              </span>
            </p>
          </div>

          {/* Feedback */}
          <div className="bg-black/40 rounded-xl border border-[#ffffff1a] p-3 text-xs text-gray-200">
            <h4 className="font-semibold text-gray-100 mb-1">
              Smart Feedback
            </h4>
            <ul className="space-y-1">
              {feedbackMessages.map((msg, idx) => (
                <li key={idx} className="text-gray-300">
                  • {msg}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
