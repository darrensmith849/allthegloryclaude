import { NextResponse } from "next/server";

export async function POST() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 500 });
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "mode": "payment",
      "success_url": `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://alltheglory.vercel.app"}/success`,
      "cancel_url": `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://alltheglory.vercel.app"}/cancel`,
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": "From Darkness To Light — Digital Album",
      "line_items[0][price_data][unit_amount]": "1000",
      "line_items[0][quantity]": "1",
    }),
  });

  const session = await res.json();

  if (session?.url) {
    return NextResponse.json({ url: session.url });
  }

  return NextResponse.json({ error: session?.error?.message ?? "Failed to create session." }, { status: 500 });
}
