import { NextResponse } from "next/server";

/**
 * Donation checkout — initializes a Paystack transaction and returns the
 * hosted-checkout URL for the browser to redirect to.
 *
 * Every donation is a gift to CrossCoders (a venture of the Kingdom Come
 * Foundation) — it does not fund the music, which is free. Card details
 * never touch this site: Paystack collects them on their own PCI-compliant
 * page, then redirects back to /donate/success where we verify the result.
 *
 * Requires the secret key in PAYSTACK_SECRET_KEY (a Cloudflare Worker
 * secret in production; .dev.vars locally). Currency is ZAR.
 */

const PAYSTACK_INIT = "https://api.paystack.co/transaction/initialize";
const CURRENCY = "ZAR";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Donations are not configured yet. Please try again soon." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const rec = (body ?? {}) as Record<string, unknown>;
  const email = String(rec.email ?? "").trim();
  const name = String(rec.name ?? "").trim();
  const amountNum = Number(rec.amount);

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return NextResponse.json(
      { error: "Please enter a valid amount." },
      { status: 400 },
    );
  }
  // Guard against absurd values; Paystack amounts are in the minor unit
  // (cents for ZAR), so multiply by 100 and round to whole cents.
  const amountMinor = Math.round(amountNum * 100);
  if (amountMinor < 5000) {
    return NextResponse.json(
      { error: "The minimum donation is R50." },
      { status: 400 },
    );
  }

  // Build the return URL from the incoming request so it works on any
  // domain (preview workers.dev, the live site, or localhost).
  const origin = new URL(req.url).origin;

  try {
    const res = await fetch(PAYSTACK_INIT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountMinor,
        currency: CURRENCY,
        callback_url: `${origin}/donate/success`,
        metadata: {
          purpose: "Donation to CrossCoders (Kingdom Come Foundation)",
          donor_name: name || undefined,
          custom_fields: [
            {
              display_name: "Beneficiary",
              variable_name: "beneficiary",
              value: "CrossCoders — Kingdom Come Foundation",
            },
          ],
        },
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string };
    };

    if (!res.ok || !data.status || !data.data?.authorization_url) {
      return NextResponse.json(
        { error: data.message || "Could not start the donation. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: data.data.authorization_url });
  } catch {
    return NextResponse.json(
      { error: "Network error reaching the payment provider. Please try again." },
      { status: 502 },
    );
  }
}
