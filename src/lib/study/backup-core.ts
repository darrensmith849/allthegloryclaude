// A full copy of The Study - the owner's study, every member's journal,
// accounts, community and the email list - saved as one JSON file in the
// private R2 bucket (binding BACKUPS, bucket alltheglory-backups). Run every
// night by the Cron Trigger in custom-worker.ts, and on demand from
// /dashboard/members. Each nightly run also clears copies older than a
// year (KEEP_DAYS), so an account a member deletes is gone from the backups
// within a year too - the live study itself is never touched by this.
// Passwords are never copied: after a restore, members set a new one with
// "Forgotten your password?".
//
// No Next.js imports: the nightly job runs outside the app.

interface D1Like {
  prepare(sql: string): {
    bind(...args: unknown[]): { run(): Promise<unknown> };
    all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  };
}
export interface R2Like {
  put(key: string, value: string, opts?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }): Promise<unknown>;
  get(key: string): Promise<{ body: ReadableStream; size: number } | null>;
  delete(keys: string | string[]): Promise<void>;
  list(opts?: { prefix?: string; cursor?: string; limit?: number; include?: ("customMetadata" | "httpMetadata")[] }): Promise<{
    objects: { key: string; size: number; uploaded: Date; customMetadata?: Record<string, string> }[];
    truncated: boolean;
    cursor?: string;
  }>;
}

// Everything needed to restore The Study. (Not kept: login sessions, reset
// links and rate-limit counters - they're short-lived by design.)
export const BACKUP_TABLES = [
  "study_notes",
  "study_note_versions",
  "study_days",
  "study_day_versions",
  "study_words",
  "study_word_versions",
  "dashboard_state",
  "members",
  "member_invites",
  "member_notes",
  "member_note_versions",
  "member_words",
  "member_word_versions",
  "member_days",
  "member_day_versions",
  "study_settings",
  "email_list",
  "community_posts",
  "community_reports",
  "community_questions",
  "weekly_reflections",
  "checkin_replies",
] as const;

export const BACKUP_PREFIX = "study/";
export const KEEP_DAYS = 365;

// Tables copied with only some columns (no password hashes).
const COLUMNS: Record<string, string> = {
  members: "id, email, name, invite_code, created_at, last_seen, disabled_at, role",
};

export async function runBackup(db: D1Like, bucket: R2Like, reason: "nightly" | "manual") {
  const tables: Record<string, unknown[]> = {};
  let rows = 0;
  for (const t of BACKUP_TABLES) {
    const { results } = await db
      .prepare(`SELECT ${COLUMNS[t] ?? "*"} FROM ${t}`)
      .all()
      .catch(() => ({ results: [] as Record<string, unknown>[] })); // a table that doesn't exist yet
    tables[t] = results;
    rows += results.length;
  }
  const now = new Date();
  const key = `${BACKUP_PREFIX}${now.toISOString().slice(0, 10)}/${now.toISOString().slice(11, 19).replace(/:/g, "")}-${reason}.json`;
  const json = JSON.stringify({ version: 1, createdAt: now.toISOString(), reason, rows, tables });
  await bucket.put(key, json, {
    httpMetadata: { contentType: "application/json" },
    customMetadata: { rows: String(rows), reason },
  });
  const info = { key, at: now.getTime(), bytes: json.length, rows, reason };
  await db
    .prepare(
      "INSERT INTO study_settings (key, value, updated_at) VALUES ('last_backup', ?1, ?2) " +
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    )
    .bind(JSON.stringify(info), now.getTime())
    .run();
  if (reason === "nightly") await pruneBackups(bucket, now).catch(() => {});
  return info;
}

// Removes backups from before KEEP_DAYS ago (keys start with the date).
async function pruneBackups(bucket: R2Like, now: Date) {
  const cutoff = new Date(now.getTime() - KEEP_DAYS * 86_400_000).toISOString().slice(0, 10);
  const old: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix: BACKUP_PREFIX, cursor, limit: 1000 });
    for (const o of page.objects) if (o.key.slice(BACKUP_PREFIX.length, BACKUP_PREFIX.length + 10) < cutoff) old.push(o.key);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  for (let i = 0; i < old.length; i += 1000) await bucket.delete(old.slice(i, i + 1000));
}
