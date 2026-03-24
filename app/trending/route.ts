import { NextResponse } from "next/server";
import recipesData from "@/data/recipes.json";

interface Recipe { id: string; title: string; description: string; prepTimeMin: number; cuisine: string; emoji: string; calories: number; mode: string[]; ingredients: { ingredientId: string; quantity: number; unit: string; isOptional?: boolean }[]; }

const TRENDING_COUNTS: Record<string, number> = {
  "rec-007": 47,
  "rec-001": 38,
  "rec-004": 31,
  "rec-005": 28,
  "rec-002": 22,
  "rec-008": 19,
  "rec-003": 14,
  "rec-006": 11,
};

export async function GET() {
  const recipes = recipesData as Recipe[];
  const trending = recipes
    .map((r) => ({ ...r, bookmarks: TRENDING_COUNTS[r.id] ?? 0 }))
    .sort((a, b) => b.bookmarks - a.bookmarks);

  return NextResponse.json({ trending });
}
