/**
 * The owner's controls for The Study (/dashboard/members). Admin session
 * required (middleware).
 *
 *   GET                                   -> { settings, invites, members }
 *   PATCH { settings: {...} }             -> { settings }
 *   PATCH { member: id, disabled: bool }  -> { ok }      pause / un-pause an account
 *   POST  { invite: { label?, maxUses? } } -> { invite }  new invite link (maxUses null = many people, default 1)
 *   POST  { reset: memberId }             -> { path }    one-time password reset link (7 days)
 *   DELETE ?invite=code                   -> { ok }      stop an invite link working
 */
import { getDb } from "@/lib/analytics/store";
import { getSettings, randomToken, saveSettings, sha256, type InviteRow, type StudySettings } from "@/lib/study/members";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };
const unavailable = () => Response.json({ error: "Storage isn't available here." }, { status: 503 });

export async function GET() {
  const db = await getDb();
  if (!db) return unavailable();
  try {
    const [settings, { results: invites }, { results: members }, { results: notes }, { results: words }] =
      await Promise.all([
        getSettings(db),
        db.prepare("SELECT * FROM member_invites ORDER BY created_at DESC").all<InviteRow>(),
        db
          .prepare("SELECT id, email, name, created_at, last_seen, disabled_at, invite_code FROM members ORDER BY created_at DESC")
          .all<{
            id: string;
            email: string;
            name: string;
            created_at: number;
            last_seen: number | null;
            disabled_at: number | null;
            invite_code: string | null;
          }>(),
        db
          .prepare("SELECT member_id, COUNT(*) AS n, COUNT(DISTINCT day) AS days FROM member_notes WHERE deleted_at IS NULL GROUP BY member_id")
          .all<{ member_id: string; n: number; days: number }>(),
        db
          .prepare("SELECT member_id, COUNT(*) AS n FROM member_words WHERE deleted_at IS NULL GROUP BY member_id")
          .all<{ member_id: string; n: number }>(),
      ]);
    return Response.json(
      {
        settings,
        invites: invites.map((i) => ({
          code: i.code,
          label: i.label ?? "",
          maxUses: i.max_uses,
          uses: i.uses,
          createdAt: i.created_at,
          revoked: Boolean(i.revoked_at),
        })),
        members: members.map((m) => ({
          id: m.id,
          email: m.email,
          name: m.name,
          createdAt: m.created_at,
          lastSeen: m.last_seen,
          disabled: Boolean(m.disabled_at),
          invite: m.invite_code,
          notes: Number(notes.find((x) => x.member_id === m.id)?.n ?? 0),
          days: Number(notes.find((x) => x.member_id === m.id)?.days ?? 0),
          words: Number(words.find((x) => x.member_id === m.id)?.n ?? 0),
        })),
      },
      { headers: noStore },
    );
  } catch (e) {
    console.error("members GET:", e);
    return Response.json({ error: "Couldn't load members." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  const body = (await req.json().catch(() => ({}))) as {
    settings?: Partial<StudySettings>;
    member?: unknown;
    disabled?: unknown;
  };
  try {
    if (body.settings && typeof body.settings === "object") {
      return Response.json({ settings: await saveSettings(db, body.settings) });
    }
    if (typeof body.member === "string" && typeof body.disabled === "boolean") {
      await db.batch([
        db.prepare("UPDATE members SET disabled_at = ?2 WHERE id = ?1").bind(body.member, body.disabled ? Date.now() : null),
        ...(body.disabled ? [db.prepare("DELETE FROM member_sessions WHERE member_id = ?1").bind(body.member)] : []),
      ]);
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Nothing to change." }, { status: 400 });
  } catch (e) {
    console.error("members PATCH:", e);
    return Response.json({ error: "Couldn't save that." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  const body = (await req.json().catch(() => ({}))) as {
    invite?: { label?: unknown; maxUses?: unknown };
    reset?: unknown;
  };
  const now = Date.now();
  try {
    if (body.invite) {
      const code = randomToken(9);
      const label = String(body.invite.label ?? "").trim().slice(0, 80);
      // null = many people; otherwise a count, one person by default.
      const n = Number(body.invite.maxUses);
      const maxUses = body.invite.maxUses === null ? null : Number.isInteger(n) && n > 0 && n <= 10_000 ? n : 1;
      await db
        .prepare("INSERT INTO member_invites (code, label, max_uses, uses, created_at) VALUES (?1, ?2, ?3, 0, ?4)")
        .bind(code, label || null, maxUses, now)
        .run();
      return Response.json({ invite: { code, label, maxUses, uses: 0, createdAt: now, revoked: false } });
    }
    if (typeof body.reset === "string") {
      const exists = await db.prepare("SELECT id FROM members WHERE id = ?1").bind(body.reset).first();
      if (!exists) return Response.json({ error: "Member not found." }, { status: 404 });
      const token = randomToken();
      await db
        .prepare("INSERT INTO member_resets (token_hash, member_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)")
        .bind(await sha256(token), body.reset, now, now + 7 * 86_400_000)
        .run();
      return Response.json({ path: `/study/reset?token=${token}` });
    }
    return Response.json({ error: "Nothing to make." }, { status: 400 });
  } catch (e) {
    console.error("members POST:", e);
    return Response.json({ error: "Couldn't make that." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  const code = new URL(req.url).searchParams.get("invite") ?? "";
  if (!code) return Response.json({ error: "Which invite?" }, { status: 400 });
  await db.prepare("UPDATE member_invites SET revoked_at = ?2 WHERE code = ?1").bind(code, Date.now()).run();
  return Response.json({ ok: true });
}
