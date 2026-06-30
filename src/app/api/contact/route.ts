import { NextResponse } from "next/server";
import { Resend } from "resend";

// Where contact-form messages are delivered.
const CONTACT_INBOX = "daniel@alltheglory.co.za";

// Resend sender. The "from" address must be on a domain VERIFIED in the
// Resend account — the mailbox itself doesn't need to exist. Override with
// the CONTACT_FROM env var if your verified sender differs.
const CONTACT_FROM =
  process.env.CONTACT_FROM ?? "All The Glory <contact@alltheglory.co.za>";

// Fallback delivery: FormSubmit relays to CONTACT_INBOX. Used only if Resend
// isn't configured or its send fails. FormSubmit needs a one-time activation
// (it emails CONTACT_INBOX an activation link on the first submission).
const FORMSUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_INBOX}`;

// Loose email shape - mirrors the client-side regex so we don't accept
// anything wildly malformed even if the form is bypassed.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactBody = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown; // honeypot - bots fill it, real users don't
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  let body: ContactBody;
  try {
    body = (await request.json()) as ContactBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Honeypot - silently accept so bots think they succeeded.
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Please enter your name." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (message.length < 10) {
    return NextResponse.json(
      { error: "Message must be at least 10 characters." },
      { status: 400 },
    );
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  const subject = `New message from ${name} (All The Glory)`;
  const text = `From: ${name} <${email}>\n\n${message}`;
  const html =
    `<p style="margin:0 0 12px"><strong>From:</strong> ${escapeHtml(name)} ` +
    `&lt;${escapeHtml(email)}&gt;</p>` +
    `<p style="white-space:pre-wrap;margin:0">${escapeHtml(message)}</p>`;

  // ── Primary: Resend ───────────────────────────────────────────────
  // Same-origin server-side send — no third-party browser call (so CORS /
  // privacy blockers can't kill it) and no activation step. Falls through to
  // FormSubmit if the key is missing or the send errors (e.g. the sender
  // domain isn't verified in Resend yet).
  const resendKey = process.env.RESEND_FULL_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const { error } = await resend.emails.send({
        from: CONTACT_FROM,
        to: CONTACT_INBOX,
        replyTo: email, // "Reply" in the inbox goes to the sender
        subject,
        text,
        html,
      });
      if (!error) return NextResponse.json({ ok: true });
      console.error("Resend contact send error (falling back):", error);
    } catch (err) {
      console.error("Resend contact send threw (falling back):", err);
    }
  }

  // ── Fallback: FormSubmit ──────────────────────────────────────────
  // FormSubmit blocks server-to-server calls that arrive without a
  // browser-style Origin/Referer, so forward the site's own origin.
  try {
    const origin =
      request.headers.get("origin") ?? "https://www.alltheglory.co.za";

    const res = await fetch(FORMSUBMIT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: origin,
        Referer: `${origin}/contact`,
      },
      body: JSON.stringify({
        name,
        email,
        message,
        _subject: subject,
        _replyto: email,
        _template: "box",
        _captcha: "false",
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      success?: string | boolean;
      message?: string;
    };
    const ok = res.ok && (data.success === true || data.success === "true");

    if (ok) return NextResponse.json({ ok: true });

    console.error("FormSubmit send error:", res.status, data);
    return NextResponse.json(
      { error: "We couldn't send your message right now. Please try again." },
      { status: 502 },
    );
  } catch (err) {
    console.error("Unexpected send error:", err);
    return NextResponse.json(
      { error: "We couldn't send your message right now. Please try again." },
      { status: 502 },
    );
  }
}
