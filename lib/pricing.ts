import ingredients from "@/data/ingredients.json";
import promotions from "@/data/promotions.json";

export interface IngredientData {
  id: string;
  name: string;
  category: string;
  unit: string;
  basePrice: number;
}

export interface Promotion {
  ingredientId: string;
  discountPct: number;
  validFrom: string;
  validUntil: string;
  source?: string;
}

export interface RecipeIngredientInput {
  ingredientId: string;
  quantity: number;
  unit: string;
  isOptional?: boolean;
}

export interface PricedIngredient {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  basePrice: number;
  effectivePrice: number;
  lineTotal: number;
  discountPct: number;
  isOptional: boolean;
}

export interface MealPriceResult {
  totalCost: number;
  totalSavings: number;
  pricedIngredients: PricedIngredient[];
  hasSaleItems: boolean;
}

function getIngredient(id: string): IngredientData | undefined {
  return (ingredients as IngredientData[]).find((i) => i.id === id);
}

function getActivePromotion(ingredientId: string): Promotion | null {
  const now = new Date();
  const promo = (promotions as Promotion[]).find(
    (p) =>
      p.ingredientId === ingredientId &&
      new Date(p.validFrom) <= now &&
      new Date(p.validUntil) >= now
  );
  return promo ?? null;
}

export function computeMealCost(
  recipeIngredients: RecipeIngredientInput[]
): MealPriceResult {
  let totalCost = 0;
  let totalSavings = 0;
  const pricedIngredients: PricedIngredient[] = [];

  for (const ri of recipeIngredients) {
    const ing = getIngredient(ri.ingredientId);
    if (!ing) continue;

    const promo = getActivePromotion(ri.ingredientId);
    const discountPct = promo?.discountPct ?? 0;
    const effectivePrice = ing.basePrice * (1 - discountPct / 100);
    const lineTotal = effectivePrice * ri.quantity;
    const lineSavings = (ing.basePrice - effectivePrice) * ri.quantity;

    totalCost += lineTotal;
    totalSavings += lineSavings;

    pricedIngredients.push({
      ingredientId: ri.ingredientId,
      name: ing.name,
      quantity: ri.quantity,
      unit: ri.unit,
      basePrice: ing.basePrice,
      effectivePrice,
      lineTotal,
      discountPct,
      isOptional: ri.isOptional ?? false,
    });
  }

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    totalSavings: Math.round(totalSavings * 100) / 100,
    pricedIngredients,
    hasSaleItems: totalSavings > 0,
  };
}
