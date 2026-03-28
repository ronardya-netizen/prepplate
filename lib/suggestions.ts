import recipesData from "@/data/recipes.json";
import { computeMealCost, MealPriceResult } from "./pricing";

export interface RecipeData {
  id: string;
  title: string;
  description: string;
  prepTimeMin: number;
  dietTags: string[];
  cuisine: string;
  emoji: string;
  calories: number;
  mode: string[];
  mealType: string;
  ingredients: { ingredientId: string; quantity: number; unit: string; isOptional?: boolean }[];
}

export interface SuggestionInput {
  pantryIngredientIds: string[];
  expiringIngredientIds: string[];
  timeMin: number;
  budgetUSD: number;
  dietPrefs: string[];
  cuisine?: string;
  mode?: string;
}

export interface SuggestionResult {
  recipe: RecipeData;
  score: number;
  pricing: MealPriceResult;
  missingIngredients: string[];
  pantryIngredients: string[];
  coveragePct: number;
  expiryBoost: boolean;
}

export function getSuggestions(input: SuggestionInput): SuggestionResult[] {
  const { pantryIngredientIds, expiringIngredientIds, timeMin, budgetUSD, dietPrefs, cuisine, mode } = input;
  const pantrySet = new Set(pantryIngredientIds);
  const expirySet = new Set(expiringIngredientIds);
  const recipes = recipesData as RecipeData[];

  const scored: SuggestionResult[] = [];

  for (const recipe of recipes) {
    const required = recipe.ingredients.filter((i) => !i.isOptional);
    const pantryMatches = required.filter((i) => pantrySet.has(i.ingredientId));
    const missing = required.filter((i) => !pantrySet.has(i.ingredientId));
    const coveragePct = required.length > 0 ? (pantryMatches.length / required.length) * 100 : 100;

    // Hard filter: must have at least 60% of ingredients
    if (coveragePct < 60) continue;
    if (recipe.prepTimeMin > timeMin) continue;
    if (cuisine && cuisine !== "all" && recipe.cuisine !== cuisine) continue;

    const pricing = computeMealCost(recipe.ingredients);
    if (pricing.totalCost > budgetUSD) continue;

    // Scoring
    let score = 0;

    // Coverage score (0-30 pts)
    score += (coveragePct / 100) * 30;

    // Expiry boost (40 pts if uses expiring ingredient)
    const usesExpiring = required.some((i) => expirySet.has(i.ingredientId));
    if (usesExpiring) score += 40;

    // Mode match (20 pts)
    if (mode && mode !== "all" && recipe.mode.includes(mode)) score += 20;

    // Cuisine match (10 pts)
    if (cuisine && cuisine !== "all" && recipe.cuisine === cuisine) score += 10;

    // Full pantry match bonus (15 pts)
    if (coveragePct === 100) score += 15;

    // Diet prefs match (5 pts)
    if (dietPrefs.length > 0 && dietPrefs.every((p) => recipe.dietTags.includes(p))) score += 5;

    scored.push({
      recipe,
      score: Math.round(score * 10) / 10,
      pricing,
      missingIngredients: missing.map((i) => i.ingredientId),
      pantryIngredients: pantryMatches.map((i) => i.ingredientId),
      coveragePct: Math.round(coveragePct),
      expiryBoost: usesExpiring,
    });
  }

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Spread across meal types — max 1 per type
  const mealTypes = ["breakfast", "lunch", "dinner", "snack", "dessert"];
  const selected: SuggestionResult[] = [];
  const usedTypes = new Set<string>();

  // First pass: pick best per meal type
  for (const type of mealTypes) {
    const best = scored.find((s) => s.recipe.mealType === type && !selected.includes(s));
    if (best) { selected.push(best); usedTypes.add(type); }
  }

  // Second pass: fill remaining slots with highest scored not yet selected
  for (const s of scored) {
    if (selected.length >= 5) break;
    if (!selected.includes(s)) selected.push(s);
  }

  return selected.slice(0, 5);
}

