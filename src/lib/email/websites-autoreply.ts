// The "thanks, I've got your message" email someone gets straight after
// sending the enquiry form on /websites. Written in Daniel's voice; it
// promises a personal reply but no fixed time.
//
// One auto-reply per address every 12 hours (D1 websites_autoreply), so the
// form can't be used to fire repeated emails at someone else's inbox.

import type { D1Db } from "@/lib/analytics/store";
import { sendEmail, type SendResult } from "./send";

const WHATSAPP = "+27 84 665 1423";
const WHATSAPP_HREF = "https://wa.me/27846651423";
const SITE = "https://alltheglory.co.za/websites";
const GAP_MS = 12 * 60 * 60 * 1000;

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** False when this address already got an auto-reply in the last 12 hours. */
async function claimSlot(db: D1Db | null, email: string): Promise<boolean> {
  if (!db) return true;
  try {
    await db.prepare("CREATE TABLE IF NOT EXISTS websites_autoreply (email TEXT PRIMARY KEY, ts INTEGER NOT NULL)").run();
    const now = Date.now();
    const row = await db.prepare("SELECT ts FROM websites_autoreply WHERE email = ?1").bind(email).first<{ ts: number }>();
    if (row && now - Number(row.ts) < GAP_MS) return false;
    await db
      .prepare("INSERT INTO websites_autoreply (email, ts) VALUES (?1, ?2) ON CONFLICT(email) DO UPDATE SET ts = excluded.ts")
      .bind(email, now)
      .run();
    return true;
  } catch {
    return true; // a D1 hiccup shouldn't cost a real person their reply
  }
}

export async function sendWebsitesAutoReply(
  db: D1Db | null,
  to: { email: string; name: string },
  message: string,
): Promise<SendResult | null> {
  if (!(await claimSlot(db, to.email.toLowerCase()))) return null;
  const first = to.name.split(/\s+/)[0] || "";
  const hi = first ? `Hi ${esc(first)},` : "Hi there,";
  const quoted = esc(message.length > 1200 ? `${message.slice(0, 1200)}…` : message).replace(/\n/g, "<br>");

  const html = `
<div style="background:#f4f2ee;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d232a">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e7e3dc">
    <div style="background:#0f161c;padding:22px 28px">
      <img src="https://alltheglory.co.za/media/websites/icon.png" width="28" height="28" alt="" style="vertical-align:middle;border:0">
      <span style="vertical-align:middle;margin-left:10px;color:#eef2f3;font-size:13px;letter-spacing:4px">DANIEL JENKINS</span>
    </div>
    <div style="height:2px;background:#d8b25a"></div>
    <div style="padding:30px 28px 8px;font-size:15.5px;line-height:1.65">
      <p style="margin:0 0 16px">${hi}</p>
      <p style="margin:0 0 16px">Thank you for telling me about your website idea. I've got your message, and I'll get back to you personally soon.</p>
      <p style="margin:0 0 22px">If you'd like to chat sooner, you can WhatsApp me any time.</p>
      <p style="margin:0 0 26px">
        <a href="${WHATSAPP_HREF}" style="display:inline-block;background:#0f161c;color:#f1d7a6;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14.5px">WhatsApp me · ${WHATSAPP}</a>
      </p>
      <p style="margin:0 0 16px">In the meantime, you're welcome to look through <a href="${SITE}#work" style="color:#9a7a2e">some of the sites I've built</a>.</p>
      <p style="margin:0 0 4px">Speak soon,</p>
      <p style="margin:0 0 26px"><strong>Daniel Jenkins</strong><br><span style="color:#6b7177;font-size:13.5px">Websites for businesses, brands &amp; people</span></p>
    </div>
    <div style="margin:0 28px 28px;padding:16px 18px;background:#f7f6f3;border-radius:10px;font-size:13.5px;line-height:1.6;color:#555b60">
      <div style="font-size:11px;letter-spacing:2px;color:#8a8f94;margin-bottom:6px">YOUR MESSAGE</div>
      ${quoted}
    </div>
  </div>
  <p style="max-width:520px;margin:16px auto 0;text-align:center;font-size:12px;color:#8a8f94">You're getting this because you sent a message through <a href="${SITE}" style="color:#8a8f94">alltheglory.co.za/websites</a>.</p>
</div>`;

  const text = `${first ? `Hi ${first},` : "Hi there,"}

Thank you for telling me about your website idea. I've got your message, and I'll get back to you personally soon.

If you'd like to chat sooner, you can WhatsApp me any time: ${WHATSAPP} (${WHATSAPP_HREF})

In the meantime, you're welcome to look through some of the sites I've built: ${SITE}#work

Speak soon,
Daniel Jenkins
Websites for businesses, brands & people

---
Your message:
${message}`;

  return sendEmail({
    to: { email: to.email, name: to.name || undefined },
    from: { email: "notify@alltheglory.co.za", name: "Daniel Jenkins" },
    replyTo: { email: "daniel@alltheglory.co.za", name: "Daniel Jenkins" },
    subject: first ? `Thanks for reaching out, ${first}` : "Thanks for reaching out",
    html,
    text,
  });
}
