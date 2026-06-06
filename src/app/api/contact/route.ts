import { NextResponse } from "next/server";
import { Resend } from "resend";

// Where messages from the contact form land.
const CONTACT_INBOX = "peter777daniel@gmail.com";

// Sender address. Resend's onboarding domain works without any DNS
// setup; once alltheglory.co.za is verified inside Resend this can
// switch to e.g. "All The Glory <contact@alltheglory.co.za>" for a
// nicer From line.
const FROM_ADDRESS = "All The Glory <onboarding@resend.dev>";

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
  if (!process.env.RESEND_API_KEY) {
    // Server hasn't been wired up yet - fail loudly so we notice in logs
    // but return a generic 500 to the client.
    console.error("RESEND_API_KEY is not set on the server.");
    return NextResponse.json(
      { error: "Email service is not configured." },
      { status: 500 },
    );
  }

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

  const resend = new Resend(process.env.RESEND_API_KEY);

  const subject = `New message from ${name} (All The Glory)`;
  const text = `${message}\n\n— ${name}\n${email}`;
  const html = `<p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
<p style="font-size:13px;color:#555;">
  <strong>${escapeHtml(name)}</strong><br />
  <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
</p>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: CONTACT_INBOX,
      subject,
      text,
      html,
      replyTo: email, // hitting "Reply" in Gmail goes straight to the sender
    });
    if (error) {
      console.error("Resend send error:", error);
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
