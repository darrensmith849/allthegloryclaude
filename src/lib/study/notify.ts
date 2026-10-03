// A short email to the owner when something in The Study needs them - a
// post waiting for approval, a reply to the weekly check-in. Best effort:
// sent through Brevo like the contact form, and never blocks the request.
// notifyOwnerFrom limits how many one member can set off (6 an hour, and
// 60 a day from everyone), so nobody can flood the inbox or use up the
// Brevo allowance that password resets need. The item itself still waits
// on the dashboard either way.

import type { D1Db } from "@/lib/analytics/store";
import { noteAttempt, tooMany } from "@/lib/study/members";

const RECIPIENT = { email: "daniel@alltheglory.co.za", name: "All The Glory" };
const SENDER = { email: "notify@alltheglory.co.za", name: "All The Glory - The Study" };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function notifyOwner(subject: string, text: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;
  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: SENDER,
      to: [RECIPIENT],
      subject,
      textContent: `${text}\n\nOpen your dashboard: https://alltheglory.co.za/dashboard/community`,
      htmlContent: `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#241e18">${esc(text).replace(/\n/g, "<br>")}<p><a href="https://alltheglory.co.za/dashboard/community">Open your dashboard</a></p></div>`,
    }),
  }).catch(() => {});
}

export async function notifyOwnerFrom(db: D1Db, memberId: string, subject: string, text: string): Promise<void> {
  const mine = `notify:${memberId}`;
  const [busy, full] = await Promise.all([tooMany(db, mine, 6, 3_600_000), tooMany(db, "notify:all", 60, 86_400_000)]);
  if (busy || full) return;
  await Promise.all([noteAttempt(db, mine), noteAttempt(db, "notify:all")]);
  await notifyOwner(subject, text);
}
