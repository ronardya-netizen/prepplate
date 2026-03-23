import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const stripeSubId = session.subscription as string;
      if (!userId) break;

      const stripeSub = await stripe.subscriptions.retrieve(stripeSubId) as unknown as { current_period_end: number };
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          tier: "paid",
          stripeSubId,
          activeUntil: new Date(stripeSub.current_period_end * 1000),
        },
        update: {
          tier: "paid",
          stripeSubId,
          activeUntil: new Date(stripeSub.current_period_end * 1000),
        },
      });
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as unknown as { subscription: string };
      const stripeSubId = invoice.subscription;
      const stripeSub = await stripe.subscriptions.retrieve(stripeSubId) as unknown as { id: string; metadata: { userId: string }; current_period_end: number };
      const userId = stripeSub.metadata?.userId;
      if (!userId) break;

      await prisma.subscription.updateMany({
        where: { stripeSubId: stripeSub.id },
        data: { activeUntil: new Date(stripeSub.current_period_end * 1000) },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.subscription.updateMany({
        where: { stripeSubId: sub.id },
        data: { tier: "free", activeUntil: null },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}