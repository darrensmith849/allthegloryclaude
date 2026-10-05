/**
 * Is email working? For the owner's Members page (admin only - middleware).
 *
 *   GET  -> { last: { at, what, ok, status, detail? } | null }   the last email the site tried to send
 *   POST -> { ok, status, detail? }   send a test email to the owner's inbox now
 */
import { getDb } from "@/lib/analytics/store";
import { sendStudyEmail, studyEmail } from "@/lib/study/mail";

export const dynamic = "force-dynamic";

const OWNER = { email: "daniel@alltheglory.co.za", name: "All The Glory" };

export async function GET() {
  const db = await getDb();
  const row = db
    ? await db
        .prepare("SELECT value FROM study_settings WHERE key = 'last_email'")
        .first<{ value: string }>()
        .catch(() => null)
    : null;
  let last = null;
  try {
    last = row ? JSON.parse(row.value) : null;
  } catch {
    // ignore a damaged value
  }
  return Response.json({ last, to: OWNER.email }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  const result = await sendStudyEmail(
    OWNER,
    "Test email from The Study",
    studyEmail({
      heading: "Email is working",
      paragraphs: [
        "This is a test from your Members page. If you're reading it, members' welcome and password-reset emails are being delivered too.",
      ],
      button: { label: "Open your dashboard", url: `${origin}/dashboard/members` },
    }),
    "Test email to you",
  );
  return Response.json(result, { status: result.ok ? 200 : 502 });
}
