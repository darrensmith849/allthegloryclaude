import { NextResponse } from "next/server";

/**
 * Verifies a Paystack transaction after the donor returns from checkout.
 * Called by /donate/success with the reference Paystack appends to the
 * callback URL. Confirms the charge server-side (the client can't be
 * trusted to report success) and returns a minimal, safe summary.
 */

const EMAIL_RE = /^[A-Za-z0-9_-]+$/; // Paystack references are url-safe tokens

export async function GET(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ status: "unconfigured" }, { status: 500 });
  }

  const reference = new URL(req.url).searchParams.get("reference")?.trim() ?? "";
  if (!reference || !EMAIL_RE.test(reference)) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const data = (await res.json().catch(() => ({}))) as {
      status?: boolean;
      data?: { status?: string; amount?: number; currency?: string };
    };

    if (!res.ok || !data.status || !data.data) {
      return NextResponse.json({ status: "unknown" }, { status: 502 });
    }

    const paid = data.data.status === "success";
    return NextResponse.json({
      status: paid ? "success" : "failed",
      // amount comes back in the minor unit (cents) — convert to major.
      amount: typeof data.data.amount === "number" ? data.data.amount / 100 : undefined,
      currency: data.data.currency,
    });
  } catch {
    return NextResponse.json({ status: "unknown" }, { status: 502 });
  }
}
