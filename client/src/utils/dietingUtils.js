// src/utils/dietingUtils.js

// ----- Food data used by Build Your Plate -----
export const FOOD_DATA = [
  // Protein
  {
    id: "chicken-100",
    name: "Chicken Breast (100g)",
    category: "protein",
    calories: 165,
    protein: 31,
    carbs: 0,
    fats: 3.6,
    icon: "/src/assets/chickenbreast.png",
  },
  {
    id: "eggs-2",
    name: "Eggs (2 whole)",
    category: "protein",
    calories: 140,
    protein: 12,
    carbs: 1,
    fats: 10,
  },
  {
    id: "greek-yogurt-170",
    name: "Greek Yogurt (170g)",
    category: "protein",
    calories: 100,
    protein: 17,
    carbs: 6,
    fats: 0,
  },
  {
    id: "protein-shake",
    name: "Whey Protein Shake",
    category: "protein",
    calories: 120,
    protein: 24,
    carbs: 3,
    fats: 2,
  },

  // Carbs
  {
    id: "rice-150",
    name: "Cooked Rice (150g)",
    category: "carbs",
    calories: 195,
    protein: 4,
    carbs: 42,
    fats: 0.4,
  },
  {
    id: "potato-150",
    name: "Baked Potato (150g)",
    category: "carbs",
    calories: 130,
    protein: 3,
    carbs: 30,
    fats: 0.2,
  },
  {
    id: "oats-50",
    name: "Oats (50g)",
    category: "carbs",
    calories: 190,
    protein: 7,
    carbs: 32,
    fats: 4,
  },
  {
    id: "bread-2",
    name: "Wholegrain Bread (2 slices)",
    category: "carbs",
    calories: 180,
    protein: 8,
    carbs: 32,
    fats: 2,
  },

  // Fats
  {
    id: "olive-oil-1tbsp",
    name: "Olive Oil (1 tbsp)",
    category: "fats",
    calories: 120,
    protein: 0,
    carbs: 0,
    fats: 14,
  },
  {
    id: "almonds-28",
    name: "Almonds (28g)",
    category: "fats",
    calories: 160,
    protein: 6,
    carbs: 6,
    fats: 14,
  },
  {
    id: "avocado-100",
    name: "Avocado (100g)",
    category: "fats",
    calories: 160,
    protein: 2,
    carbs: 9,
    fats: 15,
  },

  // Vegetables
  {
    id: "broccoli-100",
    name: "Broccoli (100g)",
    category: "vegetables",
    calories: 35,
    protein: 3,
    carbs: 7,
    fats: 0.3,
  },
  {
    id: "mixed-salad",
    name: "Mixed Salad Bowl",
    category: "vegetables",
    calories: 50,
    protein: 2,
    carbs: 10,
    fats: 0.5,
  },
  {
    id: "spinach-100",
    name: "Spinach (100g)",
    category: "vegetables",
    calories: 25,
    protein: 3,
    carbs: 4,
    fats: 0.3,
  },

  // Fruits
  {
    id: "banana-1",
    name: "Banana (1 medium)",
    category: "fruits",
    calories: 105,
    protein: 1,
    carbs: 27,
    fats: 0.3,
  },
  {
    id: "apple-1",
    name: "Apple (1 medium)",
    category: "fruits",
    calories: 95,
    protein: 0.5,
    carbs: 25,
    fats: 0.3,
  },
  {
    id: "berries-100",
    name: "Berries (100g)",
    category: "fruits",
    calories: 50,
    protein: 1,
    carbs: 12,
    fats: 0.3,
  },
];

export const FOOD_CATEGORIES = [
  { id: "protein", label: "Protein" },
  { id: "carbs", label: "Carbs" },
  { id: "fats", label: "Fats" },
  { id: "vegetables", label: "Vegetables" },
  { id: "fruits", label: "Fruits" },
];

// Compute totals from plate items
export function computeTotals(plate) {
  return plate.reduce(
    (totals, item) => {
      totals.calories += item.calories;
      totals.protein += item.protein;
      totals.carbs += item.carbs;
      totals.fats += item.fats;
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}

// Smart feedback logic based on composition
export function getPlateFeedback(plate, totals) {
  if (plate.length === 0) {
    return [
      "Your plate is empty. Start by adding a protein source, a carb, and a vegetable.",
    ];
  }

  const messages = [];

  const hasProtein = plate.some((item) => item.category === "protein");
  const hasVeg = plate.some((item) => item.category === "vegetables");
  const hasCarb = plate.some((item) => item.category === "carbs");

  if (!hasProtein || totals.protein < 20) {
    messages.push(
      "Your plate is low in protein. Add a lean source like chicken, eggs, or Greek yogurt."
    );
  }

  if (!hasVeg) {
    messages.push(
      "You have no vegetables yet. Add some greens or salad for fiber and micronutrients."
    );
  }

  if (!hasCarb) {
    messages.push(
      "You don't have any carb sources. Add rice, potatoes, oats, or fruit if you need energy."
    );
  }

  if (totals.calories > 900) {
    messages.push(
      "This is a high-calorie plate. Great for bulking, but adjust portions if your goal is fat loss."
    );
  } else if (totals.calories < 400) {
    messages.push(
      "This plate is very light. It might be more of a snack than a full meal."
    );
  }

  if (messages.length === 0) {
    messages.push(
      "Solid plate. High in protein, includes plants, and has a balance of carbs and fats."
    );
  }

  return messages;
}
