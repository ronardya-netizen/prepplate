import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";




export async function POST(req: NextRequest) {
  const { userId, dietPrefs, cuisines } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });




  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) {
    // Update preferences if provided
    if (dietPrefs || cuisines) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(dietPrefs ? { dietPrefs } : {}),
          ...(cuisines ? { cuisines } : {}),
        },
      });
      return NextResponse.json({ user: updated });
    }
    return NextResponse.json({ user: existing });
  }




  const user = await prisma.user.create({
    data: {
      id: userId,
      name: "Guest",
      dietPrefs: dietPrefs ?? [],
      cuisines: cuisines ?? [],
      defaultTimeMin: 60,
      budgetTier: "mid",
    },
  });




  return NextResponse.json({ user });
}


