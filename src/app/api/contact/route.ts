import { NextResponse } from "next/server";

// Where contact-form messages are delivered.
const CONTACT_INBOX = "daniel@alltheglory.co.za";

// FormSubmit forwards each submission straight to CONTACT_INBOX — no
// email-API keys, no sender domain to verify, and it works on any host
// (Vercel, Hetzner, Cloudflare, plain static). The very first submission
// triggers a one-time activation email to CONTACT_INBOX; click the link
// in it once and every submission after that lands in the inbox.
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
    return NextResponse.json(
      { error: "Message is too long." },
      { status: 400 },
    );
  }

  // FormSubmit blocks server-to-server calls that arrive without a
  // browser-style Origin/Referer ("...will not work in pages browsed as
  // HTML files"), so forward the site's own origin and it accepts the POST.
  const origin =
    request.headers.get("origin") ?? "https://www.alltheglory.co.za";

  try {
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
        _subject: `New message from ${name} (All The Glory)`,
        _replyto: email, // hitting "Reply" in your inbox goes to the sender
        _template: "box",
        _captcha: "false",
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      success?: string | boolean;
      message?: string;
    };
    const ok =
      res.ok && (data.success === true || data.success === "true");

    if (!ok) {
      console.error("FormSubmit send error:", res.status, data);
      return NextResponse.json(
        { error: "We couldn't send your message right now. Please try again." },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("Unexpected send error:", err);
    return NextResponse.json(
      { error: "We couldn't send your message right now. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
