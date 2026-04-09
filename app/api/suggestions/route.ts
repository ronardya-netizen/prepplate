import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuggestions } from "@/lib/suggestions";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const timeMin = parseInt(searchParams.get("time") ?? "60", 10);
  const budgetUSD = parseFloat(searchParams.get("budget") ?? "50");
  const cuisine = searchParams.get("cuisine") ?? "all";
  const mode = searchParams.get("mode") ?? "all";
  const mealType = searchParams.get("mealType") ?? "all";

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  let user;
  try {
    user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ suggestions: [] });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }

  const pantryItems = await prisma.pantryItem.findMany({
    where: { userId },
    select: { ingredientId: true },
  });

  const pantryIngredientIds = pantryItems.map((p: { ingredientId: string }) => p.ingredientId);

  // For now expiring = items flagged in localStorage (passed as query param)
  const expiringParam = searchParams.get("expiring") ?? "";
  const expiringIngredientIds = expiringParam ? expiringParam.split(",") : [];

  const suggestions = getSuggestions({
    pantryIngredientIds,
    expiringIngredientIds,
    timeMin,
    budgetUSD,
    dietPrefs: user.dietPrefs ?? [],
    cuisine,
    mode,
  });

  return NextResponse.json({ suggestions });
}
