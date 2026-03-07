import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const secret = process.env.STRIPE_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!secret || !siteUrl) {
    return NextResponse.json(
      { error: "Set STRIPE_SECRET_KEY and NEXT_PUBLIC_SITE_URL in Vercel env vars." },
      { status: 400 }
    );
  }

  const stripe = new Stripe(secret);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "From Darkness To Light — Digital Album" },
          unit_amount: 1000,
        },
        quantity: 1,
      },
    ],
    success_url: `${siteUrl}/success`,
    cancel_url: `${siteUrl}/cancel`,
  });

  return NextResponse.json({ url: session.url }, { status: 200 });
}
