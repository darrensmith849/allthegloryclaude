/**
 * The owner's controls for The Study (/dashboard/members). Admin session
 * required (middleware).
 *
 *   GET                                   -> { settings, invites, members, emailList, subscribers }
 *   GET ?export=list                      -> CSV of everyone who asked for updates
 *   GET ?export=members                   -> CSV of every Study member
 *   (CSV columns EMAIL, FIRSTNAME, LASTNAME ... import straight into Brevo)
 *   PATCH { settings: {...} }             -> { settings }
 *   PATCH { member: id, disabled: bool }  -> { ok }      pause / un-pause an account
 *   PATCH { member: id, helper: bool }    -> { ok }      let them answer members' questions (owner only)
 *   PATCH { member: id, team: bool }      -> { ok }      on the team: Study Notes, Members, Community (owner only)
 *   PATCH { unsubscribe: email }          -> { ok }      take someone off the email list (kept as unsubscribed)
 *   POST  { invite: { label?, maxUses?, team? } } -> { invite }  new invite link (maxUses null = many people, default 1;
 *                                           team: whoever uses it joins Daniel's team - owner only)
 *   POST  { reset: memberId }             -> { path }    one-time password reset link (7 days)
 *   DELETE ?invite=code                   -> { ok }      stop an invite link working
 */
import { getDb } from "@/lib/analytics/store";
import { getSettings, randomToken, saveSettings, sha256, type InviteRow, type StudySettings } from "@/lib/study/members";
import { isSignedIn } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };
const unavailable = () => Response.json({ error: "Storage isn't available here." }, { status: 503 });

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Quote, and stop spreadsheet apps reading a leading = + - @ as a formula.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};
const csv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
const splitName = (name: string | null) => {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return [parts[0] ?? "", parts.slice(1).join(" ")];
};
const day = (ms: number | null) => (ms ? new Date(ms).toISOString().slice(0, 10) : "");

async function exportCsv(which: string) {
  const db = await getDb();
  if (!db) return unavailable();
  const stamp = new Date().toISOString().slice(0, 10);
  if (which === "members") {
    const { results } = await db
      .prepare(
        "SELECT m.email, m.name, m.created_at, m.last_seen, (e.email IS NOT NULL AND e.unsubscribed_at IS NULL) AS updates " +
          "FROM members m LEFT JOIN email_list e ON e.email = m.email ORDER BY m.created_at",
      )
      .all<{ email: string; name: string; created_at: number; last_seen: number | null; updates: number }>();
    const body = csv([
      ["EMAIL", "FIRSTNAME", "LASTNAME", "JOINED", "LAST_SEEN", "EMAIL_UPDATES"],
      ...results.map((r) => [r.email, ...splitName(r.name), day(r.created_at), day(r.last_seen), r.updates ? "yes" : "no"]),
    ]);
    return new Response(body, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="study-members-${stamp}.csv"`,
        "cache-control": "no-store",
      },
    });
  }
  const { results } = await db
    .prepare("SELECT email, name, source, subscribed_at FROM email_list WHERE unsubscribed_at IS NULL ORDER BY subscribed_at")
    .all<{ email: string; name: string | null; source: string; subscribed_at: number }>();
  const body = csv([
    ["EMAIL", "FIRSTNAME", "LASTNAME", "SOURCE", "SUBSCRIBED"],
    ...results.map((r) => [r.email, ...splitName(r.name), r.source === "study" ? "The Study" : "Newsletter", day(r.subscribed_at)]),
  ]);
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="alltheglory-email-list-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}

export async function GET(req: Request) {
  const which = new URL(req.url).searchParams.get("export");
  if (which) return exportCsv(which);
  const db = await getDb();
  if (!db) return unavailable();
  try {
    const [settings, { results: invites }, { results: members }, { results: notes }, { results: words }, { results: list }] =
      await Promise.all([
        getSettings(db),
        db.prepare("SELECT * FROM member_invites ORDER BY created_at DESC").all<InviteRow>(),
        db
          .prepare(
            "SELECT m.id, m.email, m.name, m.created_at, m.last_seen, m.disabled_at, m.invite_code, m.role, i.label AS invite_label " +
              "FROM members m LEFT JOIN member_invites i ON i.code = m.invite_code ORDER BY m.created_at DESC",
          )
          .all<{
            id: string;
            email: string;
            name: string;
            created_at: number;
            last_seen: number | null;
            disabled_at: number | null;
            invite_code: string | null;
            role: string | null;
            invite_label: string | null;
          }>(),
        db
          .prepare("SELECT member_id, COUNT(*) AS n, COUNT(DISTINCT day) AS days FROM member_notes WHERE deleted_at IS NULL GROUP BY member_id")
          .all<{ member_id: string; n: number; days: number }>(),
        db
          .prepare("SELECT member_id, COUNT(*) AS n FROM member_words WHERE deleted_at IS NULL GROUP BY member_id")
          .all<{ member_id: string; n: number }>(),
        db
          .prepare("SELECT email, name, source, subscribed_at FROM email_list WHERE unsubscribed_at IS NULL ORDER BY subscribed_at DESC")
          .all<{ email: string; name: string | null; source: string; subscribed_at: number }>(),
      ]);
    const subscribed = new Set(list.map((l) => l.email));
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
          byMember: Boolean((i as InviteRow & { member_id?: string | null }).member_id),
          team: i.role === "team",
        })),
        members: members.map((m) => ({
          id: m.id,
          email: m.email,
          name: m.name,
          createdAt: m.created_at,
          lastSeen: m.last_seen,
          disabled: Boolean(m.disabled_at),
          invite: m.invite_code,
          invitedVia: m.invite_label,
          helper: m.role === "helper" || m.role === "team",
          team: m.role === "team",
          notes: Number(notes.find((x) => x.member_id === m.id)?.n ?? 0),
          days: Number(notes.find((x) => x.member_id === m.id)?.days ?? 0),
          words: Number(words.find((x) => x.member_id === m.id)?.n ?? 0),
          emailUpdates: subscribed.has(m.email),
        })),
        subscribers: list.map((l) => ({
          email: l.email,
          name: l.name ?? "",
          source: l.source === "study" ? "The Study" : "Newsletter",
          subscribedAt: l.subscribed_at,
        })),
        emailList: {
          total: list.length,
          study: list.filter((l) => l.source === "study").length,
          newsletter: list.filter((l) => l.source === "newsletter").length,
        },
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
    const unsubscribe = (body as { unsubscribe?: unknown }).unsubscribe;
    if (typeof unsubscribe === "string") {
      await db.prepare("UPDATE email_list SET unsubscribed_at = ?2 WHERE email = ?1").bind(unsubscribe.toLowerCase(), Date.now()).run();
      return Response.json({ ok: true });
    }
    const role = body as { helper?: unknown; team?: unknown };
    if (typeof body.member === "string" && (typeof role.helper === "boolean" || typeof role.team === "boolean")) {
      if (!(await isSignedIn(req.headers.get("cookie")))) {
        return Response.json({ error: "Only Daniel can change who helps." }, { status: 403 });
      }
    }
    if (typeof body.member === "string" && typeof role.team === "boolean") {
      await db.prepare("UPDATE members SET role = ?2 WHERE id = ?1").bind(body.member, role.team ? "team" : null).run();
      return Response.json({ ok: true });
    }
    if (typeof body.member === "string" && typeof (body as { helper?: unknown }).helper === "boolean") {
      const helper = (body as { helper: boolean }).helper;
      await db.prepare("UPDATE members SET role = ?2 WHERE id = ?1").bind(body.member, helper ? "helper" : null).run();
      return Response.json({ ok: true });
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
    invite?: { label?: unknown; maxUses?: unknown; team?: unknown };
    reset?: unknown;
  };
  const now = Date.now();
  try {
    if (body.invite) {
      const code = randomToken(9);
      const label = String(body.invite.label ?? "").trim().slice(0, 80);
      // null = many people; otherwise a count, one person by default.
      const n = Number(body.invite.maxUses);
      const team = body.invite.team === true;
      if (team && !(await isSignedIn(req.headers.get("cookie")))) {
        return Response.json({ error: "Only Daniel can invite people to the team." }, { status: 403 });
      }
      // A team invite is always for one person.
      const maxUses = team ? 1 : body.invite.maxUses === null ? null : Number.isInteger(n) && n > 0 && n <= 10_000 ? n : 1;
      await db
        .prepare("INSERT INTO member_invites (code, label, max_uses, uses, created_at, role) VALUES (?1, ?2, ?3, 0, ?4, ?5)")
        .bind(code, label || null, maxUses, now, team ? "team" : null)
        .run();
      return Response.json({ invite: { code, label, maxUses, uses: 0, createdAt: now, revoked: false, team } });
    }
    if (typeof body.reset === "string") {
      const exists = await db.prepare("SELECT id FROM members WHERE id = ?1").bind(body.reset).first();
      if (!exists) return Response.json({ error: "Member not found." }, { status: 404 });
      const token = randomToken();
      await db
        .prepare("INSERT INTO member_resets (token_hash, member_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)")
        .bind(await sha256(token), body.reset, now, now + 7 * 86_400_000)
        .run();
      return Response.json({ path: `/the-study?reset=${token}` });
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
