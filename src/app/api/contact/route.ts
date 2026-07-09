import { NextResponse } from "next/server";

/**
 * Contact-form + newsletter delivery — sends the submission to the site
 * owner's inbox as a transactional email through Brevo.
 *
 * This replaced Web3Forms (2026-07-07). Web3Forms sent from its own shared
 * `web3forms.com` servers, so Host-H's spam filter kept binning the
 * notifications. Brevo sends from our own authenticated domain
 * (alltheglory.co.za — SPF + DKIM + DMARC all pass), so mail lands in the
 * inbox instead of Junk.
 *
 * Requires BREVO_API_KEY (a Cloudflare Worker secret in production;
 * .dev.vars locally). The key is used server-side only — it never reaches
 * the browser.
 */

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Where submissions land, and who they appear to come from. The sender must
// be on the domain we authenticated in Brevo so DKIM/DMARC align.
const RECIPIENT = { email: "daniel@alltheglory.co.za", name: "All The Glory" };
const SENDER = { email: "notify@alltheglory.co.za", name: "All The Glory Website" };

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: Request) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Messaging isn't configured yet. Please email us directly." },
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

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [RECIPIENT],
        replyTo: { email, name: name || email },
        subject,
        htmlContent,
        textContent,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Brevo send failed", res.status, detail);
      return NextResponse.json(
        { error: "We couldn't send your message right now. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Network error. Please try again." },
      { status: 502 },
    );
  }
}
