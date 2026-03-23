import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const sub = await prisma.subscription.findUnique({ where: { userId } });

  if (!sub || sub.tier === "free") {
    return NextResponse.json({ tier: "free", active: false });
  }

  const isActive = sub.activeUntil ? sub.activeUntil > new Date() : false;

  return NextResponse.json({
    tier: sub.tier,
    active: isActive,
    activeUntil: sub.activeUntil,
  });
}

export async function POST(req: NextRequest) {
  const { userId, successUrl, cancelUrl } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          recurring: { interval: "month" },
          product_data: {
            name: "Ti Chef — Monthly",
            description: "Unlimited meal suggestions + your subscription funds ~9 meals/month for families in need.",
          },
          unit_amount: 499,
        },
        quantity: 1,
      },
    ],
    metadata: { userId },
    success_url: successUrl ?? `${process.env.NEXT_PUBLIC_BASE_URL}/settings?success=1`,
    cancel_url: cancelUrl ?? `${process.env.NEXT_PUBLIC_BASE_URL}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
