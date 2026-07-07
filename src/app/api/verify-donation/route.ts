import { NextResponse } from "next/server";
import { getDb } from "@/lib/analytics/store";

/**
 * Verifies a Paystack transaction after the donor returns from checkout.
 * Called by /donate/success with the reference Paystack appends to the
 * callback URL. Confirms the charge server-side (the client can't be
 * trusted to report success) and returns a minimal, safe summary.
 *
 * On a confirmed success it also records the gift in D1 (INSERT OR IGNORE
 * on the Paystack reference, so re-verifying the same payment — e.g. a page
 * refresh — never double-counts). Recording is best-effort: a D1 hiccup
 * never changes what the donor sees.
 */

const REF_RE = /^[A-Za-z0-9_-]+$/; // Paystack references are url-safe tokens

export async function GET(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ status: "unconfigured" }, { status: 500 });
  }

  const reference = new URL(req.url).searchParams.get("reference")?.trim() ?? "";
  if (!reference || !REF_RE.test(reference)) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const data = (await res.json().catch(() => ({}))) as {
      status?: boolean;
      data?: {
        status?: string;
        amount?: number;
        currency?: string;
        customer?: { email?: string };
      };
    };

    if (!res.ok || !data.status || !data.data) {
      return NextResponse.json({ status: "unknown" }, { status: 502 });
    }

    const paid = data.data.status === "success";

    // Record the confirmed gift durably (best-effort, never throws).
    if (paid && typeof data.data.amount === "number") {
      try {
        const db = await getDb();
        if (db) {
          await db
            .prepare(
              "INSERT OR IGNORE INTO donations (reference, amount, currency, email, ts) VALUES (?1, ?2, ?3, ?4, ?5)",
            )
            .bind(
              reference,
              data.data.amount,
              data.data.currency ?? "ZAR",
              data.data.customer?.email ?? null,
              Date.now(),
            )
            .run();
        }
      } catch {
        // D1 hiccup — the payment still succeeded; recording is secondary.
      }
    }

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
