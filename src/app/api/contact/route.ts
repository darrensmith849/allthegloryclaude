import { NextResponse } from "next/server";
import { getDb } from "@/lib/analytics/store";
import { sendEmail } from "@/lib/email/send";
import { noteEmail } from "@/lib/study/mail";
import { subscribeStmt } from "@/lib/study/members";

/**
 * Contact-form + newsletter delivery — sends the submission to the site
 * owner's inbox as a transactional email, through Cloudflare Email Sending
 * (src/lib/email/send.ts).
 *
 * Web3Forms did this until 2026-07-07, then Brevo until 2026-10-05.
 * Web3Forms sent from its own shared `web3forms.com` servers, so Host-H's
 * spam filter kept binning the notifications. Sending from our own domain
 * (alltheglory.co.za — SPF + DKIM + DMARC all pass) keeps mail in the inbox
 * instead of Junk.
 *
 * Newsletter sign-ups are also kept on the owner's email list (D1
 * email_list), downloadable from /dashboard/members.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Where submissions land, and who they appear to come from. The sender must
// be on the domain onboarded for sending so DKIM/DMARC align.
const RECIPIENT = { email: "daniel@alltheglory.co.za", name: "All The Glory" };
const SENDER = { email: "notify@alltheglory.co.za", name: "All The Glory Website" };

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const rec = (body ?? {}) as Record<string, unknown>;

  // Honeypot — real people leave this empty. Pretend success so bots learn
  // nothing, but never actually send.
  if (String(rec.website ?? rec.botcheck ?? "").trim()) {
    return NextResponse.json({ success: true });
  }

  const kind = rec.kind === "newsletter" ? "newsletter" : "contact";
  const email = String(rec.email ?? "").trim().slice(0, 200);
  const name = String(rec.name ?? "").trim().slice(0, 120);
  const message = String(rec.message ?? "").trim().slice(0, 5000);

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  // A newsletter sign-up is saved to the owner's email list first; that's
  // what matters, so it succeeds even if the "new sign-up" note to the owner
  // can't be sent.
  let saved = false;
  if (kind === "newsletter") {
    const db = await getDb();
    if (db) saved = await subscribeStmt(db, email.toLowerCase(), name || null, "newsletter").run().then(() => true, () => false);
  }
  if (kind === "contact" && message.length < 10) {
    return NextResponse.json(
      { error: "Message must be at least 10 characters." },
      { status: 400 },
    );
  }

  const subject =
    kind === "newsletter"
      ? "New newsletter signup — All The Glory"
      : `New message from ${name || "someone"} (All The Glory)`;

  const rows =
    kind === "newsletter"
      ? [["Subscriber", email]]
      : [
          ["Name", name || "—"],
          ["Email", email],
          ["Message", message],
        ];

  const htmlContent = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a">
      <h2 style="margin:0 0 4px">${kind === "newsletter" ? "New newsletter signup" : "New website message"}</h2>
      <p style="margin:0 0 16px;color:#666">From the All The Glory website.</p>
      ${rows
        .map(
          ([label, value]) =>
            `<p style="margin:0 0 12px"><strong style="color:#555">${label}</strong><br>${esc(value).replace(/\n/g, "<br>")}</p>`,
        )
        .join("")}
    </div>`;

  const textContent = `${kind === "newsletter" ? "New newsletter signup" : "New website message"}\n\n${rows
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n")}`;

  const result = await sendEmail({
    to: RECIPIENT,
    from: SENDER,
    replyTo: { email, name: name || email },
    subject,
    html: htmlContent,
    text: textContent,
  });
  await noteEmail(kind === "newsletter" ? "To you: new newsletter sign-up" : "To you: website message", result);

  if (!result.ok) {
    if (saved) return NextResponse.json({ success: true });
    const unconfigured = result.status === "not_configured";
    return NextResponse.json(
      {
        error: unconfigured
          ? "Messaging isn't configured yet. Please email us directly."
          : "We couldn't send your message right now. Please try again.",
      },
      { status: unconfigured ? 500 : 502 },
    );
  }

  return NextResponse.json({ success: true });
}
