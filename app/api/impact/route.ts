import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ImpactMetric {
  month: string;
  mealsFunded: number;
  partnerOrg: string;
  region: string;
}

export async function GET() {
  const metrics = await prisma.impactMetric.findMany({
    orderBy: { month: "desc" },
  });

  const totalMealsFunded = metrics.reduce((sum: number, m: ImpactMetric) => sum + m.mealsFunded, 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonth = metrics.filter((m: ImpactMetric) => m.month === currentMonth);
  const mealsThisMonth = thisMonth.reduce((sum: number, m: ImpactMetric) => sum + m.mealsFunded, 0);

  const partners = [...new Set(metrics.map((m: ImpactMetric) => m.partnerOrg))];

  return NextResponse.json({
    totalMealsFunded,
    mealsThisMonth,
    partners,
    recentMetrics: metrics.slice(0, 6),
  });
}