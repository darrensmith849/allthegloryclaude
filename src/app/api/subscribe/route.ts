import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Newsletter subscription endpoint.
 *
 * Adds the email to the Resend audience configured by
 * RESEND_AUDIENCE_ID, using the full-access key in
 * RESEND_FULL_API_KEY (separate from the sending-only key used by
 * /api/contact so a leaked sending key can never touch the audience).
 *
 * Returns { ok: true } on success. Duplicate sign-ups are treated as
 * success — Resend's API returns a 409 in that case, which we swallow
 * so the visitor never sees a confusing error.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? String((body as { email: unknown }).email ?? "").trim()
      : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const apiKey = process.env.RESEND_FULL_API_KEY;

  if (!audienceId || !apiKey) {
    console.error(
      "Newsletter not configured: missing RESEND_AUDIENCE_ID or RESEND_FULL_API_KEY.",
    );
    return NextResponse.json(
      { ok: false, error: "Newsletter is not configured." },
      { status: 500 },
    );
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.contacts.create({
      audienceId,
      email,
      unsubscribed: false,
    });

    if (error) {
      // The SDK returns an error object on failure. A duplicate
      // sign-up should still feel like success to the visitor, so we
      // detect 4xx-ish messages that mean "already subscribed" and
      // pretend everything is fine.
      const msg = (error.message ?? "").toLowerCase();
      const isDuplicate =
        msg.includes("already") || msg.includes("exists") || msg.includes("duplicate");
      if (!isDuplicate) {
        console.error("Resend contacts.create error:", error);
        return NextResponse.json(
          {
            ok: false,
            error:
              "We couldn't add you to the list right now. Please try again in a moment.",
          },
          { status: 502 },
        );
      }
    }
  } catch (err) {
    console.error("Unexpected newsletter error:", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          "We couldn't add you to the list right now. Please try again in a moment.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
