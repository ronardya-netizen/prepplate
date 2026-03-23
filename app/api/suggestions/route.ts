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

  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const pantryItems = await prisma.pantryItem.findMany({
    where: { userId },
    select: { ingredientId: true },
  });
  const pantryIngredientIds = pantryItems.map((p: { ingredientId: string }) => p.ingredientId);

  const suggestions = getSuggestions({
    pantryIngredientIds,
    timeMin,
    budgetUSD,
    dietPrefs: user.dietPrefs,
    cuisine,
    mode,
  });

  return NextResponse.json({ suggestions });
}
