import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ingredientsData from "@/data/ingredients.json";
import promotionsData from "@/data/promotions.json";
import recipesData from "@/data/recipes.json";

// Calorie estimates per 100g or per unit
const CALORIES: Record<string, number> = {
  "ing-001": 350,  // Pasta (per 100g)
  "ing-002": 15,   // Garlic (per piece)
  "ing-003": 740,  // Butter (per 100g)
  "ing-004": 120,  // Olive oil (per tbsp)
  "ing-005": 420,  // Parmesan (per 100g)
  "ing-006": 160,  // Chickpeas (per 100g)
  "ing-007": 30,   // Bell pepper (per piece)
  "ing-008": 45,   // Onion (per piece)
  "ing-009": 8,    // Cumin (per tbsp)
  "ing-010": 32,   // Canned tomato (per 100g)
  "ing-011": 360,  // Rice (per 100g)
  "ing-012": 10,   // Vegetable stock (per 100ml)
  "ing-013": 20,   // Lemon (per piece)
  "ing-014": 70,   // Eggs (per piece)
  "ing-015": 23,   // Spinach (per 100g)
  "ing-016": 264,  // Feta (per 100g)
  "ing-017": 130,  // Black beans (per 100g)
  "ing-018": 220,  // Tortillas (per piece)
  "ing-019": 20,   // Salsa (per tbsp)
  "ing-020": 160,  // Avocado (per piece)
};

interface IngredientData {
  id: string;
  name: string;
  category: string;
  unit: string;
  basePrice: number;
}

interface Promotion {
  ingredientId: string;
  discountPct: number;
  validFrom: string;
  validUntil: string;
}

interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
  unit: string;
  isOptional?: boolean;
}

interface Recipe {
  id: string;
  title: string;
  ingredients: RecipeIngredient[];
}

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Get pantry
  const pantryItems = await prisma.pantryItem.findMany({
    where: { userId },
    select: { ingredientId: true },
  });
  const pantrySet = new Set(pantryItems.map((p: { ingredientId: string }) => p.ingredientId));

  // Get active promotions
  const now = new Date();
  const activePromos = new Map<string, number>();
  (promotionsData as Promotion[]).forEach((p) => {
    if (new Date(p.validFrom) <= now && new Date(p.validUntil) >= now) {
      activePromos.set(p.ingredientId, p.discountPct);
    }
  });

  // Collect all needed ingredients across all recipes
  const neededMap = new Map<string, { quantity: number; unit: string; fromRecipes: string[] }>();

  (recipesData as Recipe[]).forEach((recipe) => {
    recipe.ingredients.forEach((ri) => {
      if (ri.isOptional) return;
      if (pantrySet.has(ri.ingredientId)) return; // Already have it

      if (neededMap.has(ri.ingredientId)) {
        const existing = neededMap.get(ri.ingredientId)!;
        existing.quantity += ri.quantity;
        if (!existing.fromRecipes.includes(recipe.title)) {
          existing.fromRecipes.push(recipe.title);
        }
      } else {
        neededMap.set(ri.ingredientId, {
          quantity: ri.quantity,
          unit: ri.unit,
          fromRecipes: [recipe.title],
        });
      }
    });
  });

  // Build cart items with pricing and calories
  const cartIngredients = [];
  let totalCost = 0;
  let totalSavings = 0;
  let totalCalories = 0;

  for (const [ingredientId, needed] of neededMap.entries()) {
    const ing = (ingredientsData as IngredientData[]).find((i) => i.id === ingredientId);
    if (!ing) continue;

    const discountPct = activePromos.get(ingredientId) ?? 0;
    const effectivePrice = ing.basePrice * (1 - discountPct / 100);
    const lineTotal = Math.round(effectivePrice * needed.quantity * 100) / 100;
    const lineSavings = Math.round((ing.basePrice - effectivePrice) * needed.quantity * 100) / 100;
    const calories = Math.round((CALORIES[ingredientId] ?? 50) * (needed.quantity / 100));

    totalCost += lineTotal;
    totalSavings += lineSavings;
    totalCalories += calories;

    cartIngredients.push({
      ingredientId,
      name: ing.name,
      category: ing.category,
      quantity: needed.quantity,
      unit: needed.unit,
      basePrice: ing.basePrice,
      effectivePrice,
      discountPct,
      lineTotal,
      caloriesPer100g: CALORIES[ingredientId] ?? 50,
      totalCalories: calories,
      fromRecipes: needed.fromRecipes,
      inPantry: false,
    });
  }

  // Sort by best value: most calories per dollar first
  cartIngredients.sort((a, b) => (b.totalCalories / b.lineTotal) - (a.totalCalories / a.lineTotal));

  return NextResponse.json({
    ingredients: cartIngredients,
    totalCost: Math.round(totalCost * 100) / 100,
    totalSavings: Math.round(totalSavings * 100) / 100,
    totalCalories,
    costPerCalorie: totalCalories > 0 ? Math.round((totalCost / totalCalories) * 10000) / 10000 : 0,
    mealCount: (recipesData as Recipe[]).length,
  });
}
