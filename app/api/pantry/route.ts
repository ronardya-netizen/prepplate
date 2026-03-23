import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ingredientsData from "@/data/ingredients.json";

interface IngredientData {
  id: string;
  name: string;
  category: string;
  unit: string;
  basePrice: number;
}

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const pantryItems = await prisma.pantryItem.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  // Join with local ingredients JSON
  const items = pantryItems.map((item: { id: string; userId: string; ingredientId: string; quantityLevel: string; updatedAt: Date }) => {
    const ingredient = (ingredientsData as IngredientData[]).find(
      (i) => i.id === item.ingredientId
    );
    return {
      ...item,
      ingredient: ingredient ?? { id: item.ingredientId, name: item.ingredientId, category: "pantry", unit: "g" },
    };
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, ingredientId, quantityLevel = "some" } = body;

  if (!userId || !ingredientId) {
    return NextResponse.json({ error: "userId and ingredientId required" }, { status: 400 });
  }

  const item = await prisma.pantryItem.upsert({
    where: { userId_ingredientId: { userId, ingredientId } },
    create: { userId, ingredientId, quantityLevel },
    update: { quantityLevel },
  });

  const ingredient = (ingredientsData as IngredientData[]).find((i) => i.id === ingredientId);

  return NextResponse.json({
    item: { ...item, ingredient: ingredient ?? { id: ingredientId, name: ingredientId, category: "pantry", unit: "g" } }
  }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { userId, ingredientId } = body;

  await prisma.pantryItem.deleteMany({ where: { userId, ingredientId } });

  return NextResponse.json({ success: true });
}
