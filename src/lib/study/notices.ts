// "Something new" for members' bell: a row for each session video Daniel
// posts (one call can cover several days), and a phone alert to everyone
// who turned on notifications for The Study. The push carries no message -
// the service worker asks /api/study/notices?latest=1 what's new.

import { sendPush } from "./push";

interface D1Like {
  prepare(sql: string): {
    bind(...args: unknown[]): { run(): Promise<unknown> };
    all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  };
}

export async function addVideoNotice(db: D1Like, n: { day: string; dayTo: string | null; video: string }): Promise<void> {
  await db
    .prepare("INSERT INTO study_notices (id, kind, day, day_to, video, created_at) VALUES (?1, 'video', ?2, ?3, ?4, ?5)")
    .bind(crypto.randomUUID(), n.day, n.dayTo, n.video, Date.now())
    .run();
}

/** Tells every device with notifications on (members not paused). */
export async function pushToMembers(db: D1Like, privateJwk: string | undefined): Promise<number> {
  if (!privateJwk) return 0;
  const { results } = await db
    .prepare(
      "SELECT r.endpoint FROM member_reminders r JOIN members m ON m.id = r.member_id AND m.disabled_at IS NULL",
    )
    .all<{ endpoint: string }>();
  let sent = 0;
  for (const r of results) {
    const status = await sendPush(r.endpoint, privateJwk).catch(() => 0);
    if (status >= 200 && status < 300) sent++;
    else if (status === 404 || status === 410) await db.prepare("DELETE FROM member_reminders WHERE endpoint = ?1").bind(r.endpoint).run();
  }
  return sent;
}
