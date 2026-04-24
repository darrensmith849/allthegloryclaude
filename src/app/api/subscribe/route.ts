import { NextResponse } from "next/server";

/**
 * Newsletter subscription endpoint.
 *
 * This is deliberately a stub — it validates the email shape and logs
 * to the server console so the form in the footer works end-to-end
 * immediately, and responds { ok: true } on success so the UI can show
 * the thank-you state.
 *
 * To wire a real provider, replace the "Real provider" block below
 * with a fetch() to one of:
 *
 *   - Resend:      https://resend.com/docs/api-reference/audiences/add-contact
 *   - ConvertKit:  https://developers.kit.com/#add-subscriber
 *   - Buttondown:  https://docs.buttondown.email/api-subscribers-create
 *   - Mailchimp:   https://mailchimp.com/developer/marketing/api/list-members/
 *
 * Store the provider API key as an env var (e.g. RESEND_API_KEY) on
 * Vercel so it never ships to the client.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? String((body as { email: unknown }).email ?? "").trim()
      : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  // ── Real provider block ────────────────────────────────────────
  // Swap the console.log below for a fetch() call to your provider.
  // Example (Resend audiences):
  //
  //   await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
  //     method: "POST",
  //     headers: {
  //       Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ email, unsubscribed: false }),
  //   });
  //
  console.log(`[newsletter] subscribe request: ${email}`);
  // ───────────────────────────────────────────────────────────────

  return NextResponse.json({ ok: true });
}
