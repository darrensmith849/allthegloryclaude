/**
 * Shared notes: private groups of members (tables shared_group*). Everything
 * people write arrives already locked by their browser, and this route refuses
 * anything that isn't - it never sees a group's key. See
 * src/lib/study/shared-groups.ts.
 *
 *   GET                                          -> { groups }  the groups I'm in
 *   GET   ?group=id                              -> { group, people, notes }
 *   POST  { action: "create", link, sealedName, sealedLink, myName } -> { id }
 *   POST  { action: "peek", link }               -> { id, sealedName, people, already }
 *   POST  { action: "join", link, myName }       -> { id }
 *   POST  { action: "note", group, sealed }      -> { note }
 *   POST  { action: "leave", group }             -> { ok }  my notes come out with me
 *   POST  { action: "remove", group, member }    -> { ok }  leader: takes someone out, for good
 *   POST  { action: "new-link", group, link, sealedLink } -> { ok }  leader: the old link stops working
 *   POST  { action: "close", group }             -> { ok }  leader: the group is gone for everyone
 *   PATCH { note, sealed }                       -> { note }  edit my own note
 *   PATCH { group, myName }                      -> { ok }  what I'm called here
 *   PATCH { group, sealedName }                  -> { ok }  leader: the group's name
 *   DELETE ?note=id                              -> { ok }  my note, or anyone's for the leader
 *
 * Removed notes and closed groups are erased after 30 days (bin-erase.ts).
 */
import { getDb, type D1Db } from "@/lib/analytics/store";
import { clientIp, getMember, noteAttempt, sha256, tooMany, type Member } from "@/lib/study/members";

export const dynamic = "force-dynamic";

const MAX_GROUPS = 20; // groups one member can be in
const MAX_PEOPLE = 50; // people in one group
const MAX_NOTES = 20_000; // notes in one group
const MAX_SEALED_NAME = 2_000;
const MAX_SEALED_NOTE = 120_000; // a 20,000-character note, once locked
const noStore = { "cache-control": "no-store" };

const SEALED = /^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22,}$/;
const CODE = /^[A-Za-z0-9_-]{16,64}$/;

const sealed = (v: unknown, max: number): string | null => (typeof v === "string" && v.length <= max && SEALED.test(v) ? v : null);
const code = (v: unknown): string | null => (typeof v === "string" && CODE.test(v) ? v : null);
const id = (v: unknown): string | null => (typeof v === "string" && v.length > 0 && v.length <= 64 ? v : null);

const fail = (error: string, status = 400) => Response.json({ error }, { status, headers: noStore });
const ok = (data: object = { ok: true }) => Response.json(data, { headers: noStore });
const notInGroup = () => fail("You're not in that group.", 403);
const leaderOnly = () => fail("Only the group's leader can do that.", 403);

const ACTIVE = "left_at IS NULL AND removed_at IS NULL";

async function session(req: Request): Promise<{ db: D1Db; member: Member } | Response> {
  const db = await getDb();
  if (!db) return fail("Not available right now.", 503);
  const member = await getMember(req, db);
  if (!member) return Response.json({ error: "Please log in.", login: true }, { status: 401, headers: noStore });
  return { db, member };
}

// Am I in this (open) group?
const isIn = async (db: D1Db, group: string, member: string) =>
  Boolean(
    await db
      .prepare(
        `SELECT 1 AS ok FROM shared_group_members p JOIN shared_groups g ON g.id = p.group_id ` +
          `WHERE p.group_id = ?1 AND p.member_id = ?2 AND p.left_at IS NULL AND p.removed_at IS NULL AND g.deleted_at IS NULL`,
      )
      .bind(group, member)
      .first(),
  );

// The leader is whoever has been in the group longest.
const leaderOf = async (db: D1Db, group: string) =>
  (
    await db
      .prepare(`SELECT member_id FROM shared_group_members WHERE group_id = ?1 AND ${ACTIVE} ORDER BY joined_at, member_id LIMIT 1`)
      .bind(group)
      .first<{ member_id: string }>()
  )?.member_id ?? null;

const groupByLink = (db: D1Db, hash: string) =>
  db
    .prepare(`SELECT id, sealed_name FROM shared_groups WHERE link_hash = ?1 AND deleted_at IS NULL`)
    .bind(hash)
    .first<{ id: string; sealed_name: string }>();

const countPeople = async (db: D1Db, group: string) =>
  Number(
    (
      await db
        .prepare(`SELECT COUNT(*) AS n FROM shared_group_members WHERE group_id = ?1 AND ${ACTIVE}`)
        .bind(group)
        .first<{ n: number }>()
    )?.n ?? 0,
  );

const countMyGroups = async (db: D1Db, member: string) =>
  Number(
    (
      await db
        .prepare(
          `SELECT COUNT(*) AS n FROM shared_group_members p JOIN shared_groups g ON g.id = p.group_id ` +
            `WHERE p.member_id = ?1 AND p.left_at IS NULL AND p.removed_at IS NULL AND g.deleted_at IS NULL`,
        )
        .bind(member)
        .first<{ n: number }>()
    )?.n ?? 0,
  );

// Someone is out of a group: their notes come out too, and a group with
// nobody left in it closes.
const takeOut = (db: D1Db, group: string, member: string, column: "left_at" | "removed_at", now: number) => [
  db.prepare(`UPDATE shared_group_members SET ${column} = ?3 WHERE group_id = ?1 AND member_id = ?2`).bind(group, member, now),
  db
    .prepare("UPDATE shared_group_notes SET deleted_at = ?3, updated_at = ?3 WHERE group_id = ?1 AND member_id = ?2 AND deleted_at IS NULL")
    .bind(group, member, now),
  db
    .prepare(
      `UPDATE shared_groups SET deleted_at = ?2, updated_at = ?2 WHERE id = ?1 AND deleted_at IS NULL ` +
        `AND NOT EXISTS (SELECT 1 FROM shared_group_members WHERE group_id = ?1 AND ${ACTIVE})`,
    )
    .bind(group, now),
];

export async function GET(req: Request) {
  const ctx = await session(req);
  if (ctx instanceof Response) return ctx;
  const { db, member } = ctx;
  try {
    const group = new URL(req.url).searchParams.get("group");
    if (!group) {
      const { results } = await db
        .prepare(
          `SELECT g.id, g.sealed_name, g.sealed_link, g.updated_at, ` +
            `(SELECT COUNT(*) FROM shared_group_members x WHERE x.group_id = g.id AND x.left_at IS NULL AND x.removed_at IS NULL) AS people, ` +
            `(SELECT COUNT(*) FROM shared_group_notes n WHERE n.group_id = g.id AND n.deleted_at IS NULL) AS notes, ` +
            `(SELECT x.member_id FROM shared_group_members x WHERE x.group_id = g.id AND x.left_at IS NULL AND x.removed_at IS NULL ORDER BY x.joined_at, x.member_id LIMIT 1) AS leader ` +
            `FROM shared_group_members p JOIN shared_groups g ON g.id = p.group_id ` +
            `WHERE p.member_id = ?1 AND p.left_at IS NULL AND p.removed_at IS NULL AND g.deleted_at IS NULL ORDER BY g.updated_at DESC`,
        )
        .bind(member.id)
        .all<{ id: string; sealed_name: string; sealed_link: string; updated_at: number; people: number; notes: number; leader: string }>();
      return ok({
        groups: results.map((g) => ({
          id: g.id,
          sealedName: g.sealed_name,
          sealedLink: g.sealed_link,
          people: g.people,
          notes: g.notes,
          leader: g.leader === member.id,
          updatedAt: g.updated_at,
        })),
      });
    }

    if (!(await isIn(db, group, member.id))) return notInGroup();
    const [info, people, notes] = await Promise.all([
      db.prepare("SELECT id, sealed_name, sealed_link, updated_at FROM shared_groups WHERE id = ?1").bind(group).first<{
        id: string;
        sealed_name: string;
        sealed_link: string;
        updated_at: number;
      }>(),
      db
        .prepare(`SELECT member_id, sealed_name, joined_at FROM shared_group_members WHERE group_id = ?1 AND ${ACTIVE} ORDER BY joined_at, member_id`)
        .bind(group)
        .all<{ member_id: string; sealed_name: string; joined_at: number }>(),
      db
        .prepare("SELECT id, member_id, sealed, created_at, updated_at FROM shared_group_notes WHERE group_id = ?1 AND deleted_at IS NULL ORDER BY created_at")
        .bind(group)
        .all<{ id: string; member_id: string; sealed: string; created_at: number; updated_at: number }>(),
    ]);
    return ok({
      group: { id: info?.id, sealedName: info?.sealed_name, sealedLink: info?.sealed_link, updatedAt: info?.updated_at },
      people: people.results.map((p, i) => ({
        id: p.member_id,
        sealedName: p.sealed_name,
        joinedAt: p.joined_at,
        leader: i === 0,
        me: p.member_id === member.id,
      })),
      notes: notes.results.map((n) => ({ id: n.id, memberId: n.member_id, sealed: n.sealed, createdAt: n.created_at, updatedAt: n.updated_at })),
    });
  } catch (e) {
    console.error("groups GET:", e);
    return fail("Couldn't open that.", 500);
  }
}

export async function POST(req: Request) {
  const ctx = await session(req);
  if (ctx instanceof Response) return ctx;
  const { db, member } = ctx;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const now = Date.now();
  try {
    switch (body.action) {
      case "create": {
        const link = code(body.link);
        const name = sealed(body.sealedName, MAX_SEALED_NAME);
        const sealedLink = sealed(body.sealedLink, MAX_SEALED_NAME);
        const myName = sealed(body.myName, MAX_SEALED_NAME);
        if (!link || !name || !sealedLink || !myName) return fail("Couldn't lock that - try again.");
        if ((await countMyGroups(db, member.id)) >= MAX_GROUPS) return fail(`You can be in ${MAX_GROUPS} groups at most.`, 413);
        const group = crypto.randomUUID();
        await db.batch([
          db
            .prepare("INSERT INTO shared_groups (id, sealed_name, sealed_link, link_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)")
            .bind(group, name, sealedLink, await sha256(link), now),
          db
            .prepare("INSERT INTO shared_group_members (group_id, member_id, sealed_name, joined_at) VALUES (?1, ?2, ?3, ?4)")
            .bind(group, member.id, myName, now),
        ]);
        return ok({ id: group });
      }

      case "peek":
      case "join": {
        const link = code(body.link);
        const key = `group-link:${clientIp(req)}`;
        if (await tooMany(db, key, 30, 3_600_000)) return fail("Too many tries - wait a while and open the link again.", 429);
        const group = link ? await groupByLink(db, await sha256(link)) : null;
        if (!group) {
          await noteAttempt(db, key);
          return fail("This link doesn't work any more - ask for the group's new one.", 404);
        }
        const mine = await db
          .prepare("SELECT left_at, removed_at FROM shared_group_members WHERE group_id = ?1 AND member_id = ?2")
          .bind(group.id, member.id)
          .first<{ left_at: number | null; removed_at: number | null }>();
        if (mine?.removed_at) return fail("The group's leader has taken you out of this group.", 403);
        const already = Boolean(mine && !mine.left_at);
        if (body.action === "peek") {
          return ok({ id: group.id, sealedName: group.sealed_name, people: await countPeople(db, group.id), already });
        }
        if (already) return ok({ id: group.id });
        const myName = sealed(body.myName, MAX_SEALED_NAME);
        if (!myName) return fail("Couldn't lock your name - try again.");
        if ((await countMyGroups(db, member.id)) >= MAX_GROUPS) return fail(`You can be in ${MAX_GROUPS} groups at most.`, 413);
        if ((await countPeople(db, group.id)) >= MAX_PEOPLE) return fail(`This group is full (${MAX_PEOPLE} people).`, 413);
        await db.batch([
          db
            .prepare(
              "INSERT INTO shared_group_members (group_id, member_id, sealed_name, joined_at) VALUES (?1, ?2, ?3, ?4) " +
                "ON CONFLICT(group_id, member_id) DO UPDATE SET sealed_name = excluded.sealed_name, joined_at = excluded.joined_at, left_at = NULL",
            )
            .bind(group.id, member.id, myName, now),
          db.prepare("UPDATE shared_groups SET updated_at = ?2 WHERE id = ?1").bind(group.id, now),
        ]);
        return ok({ id: group.id });
      }

      case "note": {
        const group = id(body.group);
        const text = sealed(body.sealed, MAX_SEALED_NOTE);
        if (!group || !text) return fail("Couldn't lock that note - try again.");
        if (!(await isIn(db, group, member.id))) return notInGroup();
        const count = await db
          .prepare("SELECT COUNT(*) AS n FROM shared_group_notes WHERE group_id = ?1 AND deleted_at IS NULL")
          .bind(group)
          .first<{ n: number }>();
        if (Number(count?.n ?? 0) >= MAX_NOTES) return fail("This group is full.", 413);
        const note = crypto.randomUUID();
        await db.batch([
          db
            .prepare("INSERT INTO shared_group_notes (id, group_id, member_id, sealed, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)")
            .bind(note, group, member.id, text, now),
          db.prepare("UPDATE shared_groups SET updated_at = ?2 WHERE id = ?1").bind(group, now),
        ]);
        return ok({ note: { id: note, memberId: member.id, sealed: text, createdAt: now, updatedAt: now } });
      }

      case "leave": {
        const group = id(body.group);
        if (!group || !(await isIn(db, group, member.id))) return notInGroup();
        await db.batch(takeOut(db, group, member.id, "left_at", now));
        return ok();
      }

      case "remove": {
        const group = id(body.group);
        const who = id(body.member);
        if (!group || !who) return fail("Who should come out?");
        if (!(await isIn(db, group, member.id))) return notInGroup();
        if ((await leaderOf(db, group)) !== member.id) return leaderOnly();
        if (who === member.id) return fail("Use Leave this group instead.");
        if (!(await isIn(db, group, who))) return fail("They're not in this group.", 404);
        await db.batch(takeOut(db, group, who, "removed_at", now));
        return ok();
      }

      case "new-link": {
        const group = id(body.group);
        const link = code(body.link);
        const sealedLink = sealed(body.sealedLink, MAX_SEALED_NAME);
        if (!group || !link || !sealedLink) return fail("Couldn't make a new link - try again.");
        if (!(await isIn(db, group, member.id))) return notInGroup();
        if ((await leaderOf(db, group)) !== member.id) return leaderOnly();
        await db
          .prepare("UPDATE shared_groups SET sealed_link = ?2, link_hash = ?3, updated_at = ?4 WHERE id = ?1")
          .bind(group, sealedLink, await sha256(link), now)
          .run();
        return ok();
      }

      case "close": {
        const group = id(body.group);
        if (!group) return fail("Which group?");
        if (!(await isIn(db, group, member.id))) return notInGroup();
        if ((await leaderOf(db, group)) !== member.id) return leaderOnly();
        await db.prepare("UPDATE shared_groups SET deleted_at = ?2, updated_at = ?2 WHERE id = ?1").bind(group, now).run();
        return ok();
      }

      default:
        return fail("Not sure what to do with that.");
    }
  } catch (e) {
    console.error("groups POST:", e);
    return fail("Couldn't save that.", 500);
  }
}

export async function PATCH(req: Request) {
  const ctx = await session(req);
  if (ctx instanceof Response) return ctx;
  const { db, member } = ctx;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const now = Date.now();
  try {
    const note = id(body.note);
    if (note) {
      const text = sealed(body.sealed, MAX_SEALED_NOTE);
      if (!text) return fail("Couldn't lock that note - try again.");
      const row = await db
        .prepare("SELECT group_id, member_id FROM shared_group_notes WHERE id = ?1 AND deleted_at IS NULL")
        .bind(note)
        .first<{ group_id: string; member_id: string }>();
      if (!row || row.member_id !== member.id || !(await isIn(db, row.group_id, member.id))) return fail("You can only change your own notes.", 403);
      await db.prepare("UPDATE shared_group_notes SET sealed = ?2, updated_at = ?3 WHERE id = ?1").bind(note, text, now).run();
      return ok({ note: { id: note, memberId: member.id, sealed: text, updatedAt: now } });
    }

    const group = id(body.group);
    if (!group || !(await isIn(db, group, member.id))) return notInGroup();
    if (body.myName !== undefined) {
      const myName = sealed(body.myName, MAX_SEALED_NAME);
      if (!myName) return fail("Couldn't lock your name - try again.");
      await db
        .prepare("UPDATE shared_group_members SET sealed_name = ?3 WHERE group_id = ?1 AND member_id = ?2")
        .bind(group, member.id, myName)
        .run();
      return ok();
    }
    const name = sealed(body.sealedName, MAX_SEALED_NAME);
    if (!name) return fail("Couldn't lock that name - try again.");
    if ((await leaderOf(db, group)) !== member.id) return leaderOnly();
    await db.prepare("UPDATE shared_groups SET sealed_name = ?2, updated_at = ?3 WHERE id = ?1").bind(group, name, now).run();
    return ok();
  } catch (e) {
    console.error("groups PATCH:", e);
    return fail("Couldn't save that.", 500);
  }
}

export async function DELETE(req: Request) {
  const ctx = await session(req);
  if (ctx instanceof Response) return ctx;
  const { db, member } = ctx;
  const note = new URL(req.url).searchParams.get("note") ?? "";
  try {
    const row = await db
      .prepare("SELECT group_id, member_id FROM shared_group_notes WHERE id = ?1 AND deleted_at IS NULL")
      .bind(note)
      .first<{ group_id: string; member_id: string }>();
    if (!row || !(await isIn(db, row.group_id, member.id))) return fail("Note not found.", 404);
    if (row.member_id !== member.id && (await leaderOf(db, row.group_id)) !== member.id) return fail("You can only remove your own notes.", 403);
    const now = Date.now();
    await db.prepare("UPDATE shared_group_notes SET deleted_at = ?2, updated_at = ?2 WHERE id = ?1").bind(note, now).run();
    return ok();
  } catch (e) {
    console.error("groups DELETE:", e);
    return fail("Couldn't remove that.", 500);
  }
}
