import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ingredientsData from "@/data/ingredients.json";

interface IngredientData { id: string; name: string; category: string; unit: string; basePrice: number; }

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  try {
    const pantryItems = await prisma.pantryItem.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
    const items = pantryItems.map((item: { id: string; userId: string; ingredientId: string; quantityLevel: string; updatedAt: Date }) => {
      const ingredient = (ingredientsData as IngredientData[]).find((i) => i.id === item.ingredientId);
      const parts = item.quantityLevel.split("|");
      const expiryPart = parts.find((p) => p.startsWith("expiry:"));
      const expiryDays = expiryPart ? parseInt(expiryPart.replace("expiry:", "")) : undefined;
      return { ...item, expiryDays, ingredient: ingredient ?? { id: item.ingredientId, name: item.ingredientId, category: "pantry", unit: "g" } };
    });
    return NextResponse.json({ items });
  } catch (e) { console.error(e); return NextResponse.json({ items: [] }); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ingredientId, quantityLevel = "some", expiryDays } = body;
    if (!userId || !ingredientId) return NextResponse.json({ error: "userId and ingredientId required" }, { status: 400 });

    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, name: "Guest", dietPrefs: [], defaultTimeMin: 60, budgetTier: "mid" },
      update: {},
    });

    const ql = expiryDays !== undefined ? `${quantityLevel}|expiry:${expiryDays}` : quantityLevel;

    const item = await prisma.pantryItem.upsert({
      where: { userId_ingredientId: { userId, ingredientId } },
      create: { userId, ingredientId, quantityLevel: ql },
      update: { quantityLevel: ql },
    });

    const ingredient = (ingredientsData as IngredientData[]).find((i) => i.id === ingredientId);
    return NextResponse.json({ item: { ...item, ingredient: ingredient ?? { id: ingredientId, name: ingredientId, category: "pantry", unit: "g" } } }, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const ingredientId = searchParams.get("ingredientId");
    if (!userId || !ingredientId) return NextResponse.json({ error: "missing params" }, { status: 400 });
    await prisma.pantryItem.deleteMany({ where: { userId, ingredientId } });
    return NextResponse.json({ success: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

