// Emails from The Study to a member - password resets and the welcome note.
// Sent through Brevo from the site's authenticated address (same as the
// contact form), in the album flyer's style. Returns false if it couldn't
// send; callers never fail a request over it.

import { getDb } from "@/lib/analytics/store";

const SENDER = { email: "notify@alltheglory.co.za", name: "All The Glory - The Study" };

export interface EmailResult {
  ok: boolean;
  status: number; // Brevo's HTTP status (0 = couldn't reach it / no key)
  detail?: string; // Brevo's message when it refused
}

// The last email's result, for the owner's Members page ("Email is working").
export async function noteEmail(what: string, result: EmailResult): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const now = Date.now();
  await db
    .prepare(
      "INSERT INTO study_settings (key, value, updated_at) VALUES ('last_email', ?1, ?2) " +
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    )
    .bind(JSON.stringify({ at: now, what, ok: result.ok, status: result.status, detail: result.detail?.slice(0, 200) }), now)
    .run()
    .catch(() => {});
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// A cream card with a gold frame, a heading, paragraphs and one button.
export function studyEmail(opts: { heading: string; paragraphs: string[]; button?: { label: string; url: string }; footer?: string }) {
  const p = opts.paragraphs
    .map((t) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#3a3229">${esc(t)}</p>`)
    .join("");
  const button = opts.button
    ? `<p style="margin:22px 0"><a href="${opts.button.url}" style="display:inline-block;padding:12px 22px;background:#95711f;color:#fffaf0;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">${esc(opts.button.label)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#efe6d6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fbf8f1;border:1px solid #d6be85">
<tr><td style="padding:34px 38px;font-family:Georgia,serif">
<p style="margin:0 0 6px;text-align:center;font-size:13px;letter-spacing:6px;color:#a8842c">ALL THE GLORY</p>
<p style="margin:0 0 26px;text-align:center;font-size:11px;letter-spacing:4px;color:#857967;font-family:Arial,sans-serif">THE STUDY</p>
<h1 style="margin:0 0 18px;font-size:26px;font-weight:normal;color:#241e18">${esc(opts.heading)}</h1>
${p}${button}
<p style="margin:26px 0 0;font-size:12.5px;line-height:1.5;color:#857967;font-family:Arial,sans-serif">${esc(opts.footer ?? "All The Glory · alltheglory.co.za")}</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = [opts.heading, "", ...opts.paragraphs, ...(opts.button ? ["", `${opts.button.label}: ${opts.button.url}`] : []), "", opts.footer ?? "All The Glory · alltheglory.co.za"].join("\n");
  return { html, text };
}

export async function sendStudyEmail(
  to: { email: string; name?: string },
  subject: string,
  body: { html: string; text: string },
  what = subject,
): Promise<EmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, status: 0, detail: "No BREVO_API_KEY here" };
  let result: EmailResult;
  try {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sender: SENDER, to: [to], subject, htmlContent: body.html, textContent: body.text }),
    });
    result = { ok: r.ok, status: r.status, detail: r.ok ? undefined : await r.text().catch(() => "") };
    if (!r.ok) console.error("Brevo send failed", r.status, result.detail);
  } catch (e) {
    result = { ok: false, status: 0, detail: e instanceof Error ? e.message : "network" };
  }
  await noteEmail(what, result);
  return result;
}
