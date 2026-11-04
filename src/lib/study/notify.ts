// A short email to the owner when something in The Study needs them - a
// post waiting for approval, a reply to the weekly check-in. Best effort:
// sent like the contact form (src/lib/email/send.ts), and never blocks the
// request. notifyOwnerFrom limits how many one member can set off (6 an hour,
// and 60 a day from everyone), so nobody can flood the inbox or crowd out the
// password resets. The item itself still waits on the dashboard either way.

import type { D1Db } from "@/lib/analytics/store";
import { sendEmail } from "@/lib/email/send";
import { noteEmail } from "@/lib/study/mail";
import { noteAttempt, tooMany } from "@/lib/study/members";

const RECIPIENT = { email: "daniel@alltheglory.co.za", name: "All The Glory" };
const SENDER = { email: "notify@alltheglory.co.za", name: "All The Glory - The Study" };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function notifyOwner(subject: string, text: string): Promise<void> {
  const result = await sendEmail({
    to: RECIPIENT,
    from: SENDER,
    subject,
    text: `${text}\n\nOpen your dashboard: https://alltheglory.co.za/dashboard/community`,
    html: `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#241e18">${esc(text).replace(/\n/g, "<br>")}<p><a href="https://alltheglory.co.za/dashboard/community">Open your dashboard</a></p></div>`,
  });
  await noteEmail(`To you: ${subject}`, result);
}

export async function notifyOwnerFrom(
  db: D1Db,
  memberId: string,
  subject: string,
  text: string,
  opts: { team?: boolean } = {}, // also email the owner's team (Reggie)
): Promise<void> {
  const mine = `notify:${memberId}`;
  const [busy, full] = await Promise.all([tooMany(db, mine, 6, 3_600_000), tooMany(db, "notify:all", 60, 86_400_000)]);
  if (busy || full) return;
  await Promise.all([noteAttempt(db, mine), noteAttempt(db, "notify:all")]);
  await notifyOwner(subject, text);
  if (!opts.team) return;
  const { results: team } = await db
    .prepare("SELECT email, name FROM members WHERE role = 'team' AND disabled_at IS NULL LIMIT 5")
    .all<{ email: string; name: string }>()
    .catch(() => ({ results: [] as { email: string; name: string }[] }));
  for (const t of team) {
    const result = await sendEmail({
      to: { email: t.email, name: t.name },
      from: SENDER,
      subject,
      text: `${text}\n\nOpen the dashboard: https://alltheglory.co.za/dashboard/community`,
      html: `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#241e18">${esc(text).replace(/\n/g, "<br>")}<p><a href="https://alltheglory.co.za/dashboard/community">Open the dashboard</a></p></div>`,
    });
    await noteEmail(`To ${t.name}: ${subject}`, result);
  }
}
