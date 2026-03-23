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
  ingredients: {
    ingredientId: string;
    quantity: number;
    unit: string;
    isOptional?: boolean;
  }[];
}

export interface SuggestionInput {
  pantryIngredientIds: string[];
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
}

function matchesDietPrefs(recipe: RecipeData, prefs: string[]): boolean {
  if (!prefs.length) return true;
  return prefs.every((pref) => recipe.dietTags.includes(pref));
}

export function getSuggestions(input: SuggestionInput): SuggestionResult[] {
  const { pantryIngredientIds, timeMin, budgetUSD, dietPrefs, cuisine, mode } = input;
  const pantrySet = new Set(pantryIngredientIds);
  const recipes = recipesData as RecipeData[];
  const results: SuggestionResult[] = [];

  for (const recipe of recipes) {
    if (recipe.prepTimeMin > timeMin) continue;
    if (!matchesDietPrefs(recipe, dietPrefs)) continue;
    if (cuisine && cuisine !== "all" && recipe.cuisine !== cuisine) continue;
    if (mode && mode !== "all" && !recipe.mode.includes(mode)) continue;

    const pricing = computeMealCost(recipe.ingredients);
    if (pricing.totalCost > budgetUSD) continue;

    const requiredIngredients = recipe.ingredients.filter((i) => !i.isOptional);
    const pantryMatches = requiredIngredients.filter((i) => pantrySet.has(i.ingredientId));
    const missingIngredients = requiredIngredients
      .filter((i) => !pantrySet.has(i.ingredientId))
      .map((i) => i.ingredientId);

    const coveragePct = requiredIngredients.length > 0
      ? (pantryMatches.length / requiredIngredients.length) * 100
      : 100;

    const coverageScore = coveragePct / 100;
    const budgetScore = budgetUSD > 0 ? 1 - pricing.totalCost / budgetUSD : 0;
    const saleBonus = pricing.hasSaleItems ? 0.2 : 0;
    const score = coverageScore * 0.5 + budgetScore * 0.3 + saleBonus;

    results.push({
      recipe,
      score: Math.round(score * 1000) / 1000,
      pricing,
      missingIngredients,
      pantryIngredients: pantryMatches.map((i) => i.ingredientId),
      coveragePct: Math.round(coveragePct),
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}
