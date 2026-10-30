// Family's own dashboard (Daniel's sister), set up by Daniel in Settings.
//
//   GET                         -> { member: { id, name, createdAt, lastSeen, disabled } | null }
//   POST { name, password }     -> sets it up the first time, or changes her name / password
//   POST { disabled: boolean }  -> turns her login off or on again
//
// She is a Study member with role 'personal' and no real email (she logs in
// on the dashboard with just her password - src/app/api/admin/login), so her
// study journal is hers like any member's (member_* rows), and her Money and
// To do are her own saved dashboard (src/lib/team.ts). Owner only. Nothing is
// ever deleted: turning it off keeps everything; a new password logs her out
// of her other devices.
import { getDb } from "@/lib/analytics/store";
import { isSignedIn, MIN_PASSWORD, tidyPassword } from "@/lib/admin-auth";
import { cleanName, hashMemberPassword } from "@/lib/study/members";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  name: string;
  created_at: number;
  last_seen: number | null;
  disabled_at: number | null;
}

const find = (db: NonNullable<Awaited<ReturnType<typeof getDb>>>) =>
  db
    .prepare("SELECT id, name, created_at, last_seen, disabled_at FROM members WHERE role = 'personal' ORDER BY created_at LIMIT 1")
    .first<Row>();

const view = (r: Row | null) =>
  r ? { id: r.id, name: r.name, createdAt: r.created_at, lastSeen: r.last_seen, disabled: Boolean(r.disabled_at) } : null;

export async function GET(req: Request) {
  if (!(await isSignedIn(req.headers.get("cookie")))) return Response.json({ error: "Only Daniel can see this." }, { status: 401 });
  const db = await getDb();
  if (!db) return Response.json({ error: "No database." }, { status: 503 });
  return Response.json({ member: view(await find(db)) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  if (!(await isSignedIn(req.headers.get("cookie")))) return Response.json({ error: "Only Daniel can change this." }, { status: 401 });
  const db = await getDb();
  if (!db) return Response.json({ error: "No database." }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { name?: unknown; password?: unknown; disabled?: unknown };
  const existing = await find(db);

  if (typeof body.disabled === "boolean") {
    if (!existing) return Response.json({ error: "Set up her dashboard first." }, { status: 400 });
    await db.prepare("UPDATE members SET disabled_at = ?2 WHERE id = ?1").bind(existing.id, body.disabled ? Date.now() : null).run();
    return Response.json({ member: view(await find(db)) });
  }

  const name = cleanName(body.name);
  const password = body.password == null || body.password === "" ? null : tidyPassword(String(body.password));
  if (password != null && (password.length < MIN_PASSWORD || password.length > 200)) {
    return Response.json({ error: `Use at least ${MIN_PASSWORD} characters for her password.` }, { status: 400 });
  }
  try {
    if (!existing) {
      if (!name || !password) return Response.json({ error: "Put in her name and a password." }, { status: 400 });
      const id = crypto.randomUUID();
      const rec = await hashMemberPassword(password);
      await db
        .prepare(
          "INSERT INTO members (id, email, name, hash, salt, iterations, invite_code, created_at, role) VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, ?7, 'personal')",
        )
        // No real email - she logs in with her password alone. ".invalid" can never receive mail.
        .bind(id, `family-${id}@family.invalid`, name, rec.hash, rec.salt, rec.iterations, Date.now())
        .run();
      return Response.json({ member: view(await find(db)) });
    }
    if (name) await db.prepare("UPDATE members SET name = ?2 WHERE id = ?1").bind(existing.id, name).run();
    if (password) {
      const rec = await hashMemberPassword(password);
      await db.batch([
        db.prepare("UPDATE members SET hash = ?2, salt = ?3, iterations = ?4 WHERE id = ?1").bind(existing.id, rec.hash, rec.salt, rec.iterations),
        // Her other devices log in again with the new password.
        db.prepare("DELETE FROM member_sessions WHERE member_id = ?1").bind(existing.id),
      ]);
    }
    return Response.json({ member: view(await find(db)) });
  } catch (e) {
    console.error("family:", e);
    return Response.json({ error: "Couldn't save that. Try again." }, { status: 500 });
  }
}
