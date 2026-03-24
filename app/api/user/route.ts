import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) return NextResponse.json({ user: existing });

  const user = await prisma.user.create({
    data: {
      id: userId,
      name: "Guest",
      dietPrefs: [],
      defaultTimeMin: 60,
      budgetTier: "mid",
    },
  });

  return NextResponse.json({ user });
}