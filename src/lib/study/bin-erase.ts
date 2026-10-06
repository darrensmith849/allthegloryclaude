// The Recycle bin's nightly clean-up, run by the worker's cron after the
// backup (custom-worker.ts) - so, like backup-core.ts, it imports nothing.

export const BIN_DAYS = 30; // how long deleted items can be restored

interface D1Stmt {
  bind(...v: unknown[]): D1Stmt;
}
interface D1Like {
  prepare(sql: string): D1Stmt;
  batch(statements: D1Stmt[]): Promise<unknown>;
}

// Nightly, after the backup: members' emptied items, and anything in their
// bin for over 30 days, are erased for good (with their edit history). The
// owner's study tables are never touched.
export async function eraseMemberBin(db: D1Like): Promise<void> {
  const cutoff = Date.now() - BIN_DAYS * 86_400_000;
  const gone = (t: string) => `(${t}.purged_at IS NOT NULL OR (${t}.deleted_at IS NOT NULL AND ${t}.deleted_at < ${cutoff}))`;
  await db
    .batch([
      db.prepare(
        `DELETE FROM member_note_versions WHERE EXISTS (SELECT 1 FROM member_notes n WHERE n.id = member_note_versions.note_id AND n.member_id = member_note_versions.member_id AND ${gone("n")})`,
      ),
      db.prepare(`DELETE FROM member_notes WHERE ${gone("member_notes")}`),
      db.prepare(
        `DELETE FROM member_word_versions WHERE EXISTS (SELECT 1 FROM member_words w WHERE w.id = member_word_versions.word_id AND w.member_id = member_word_versions.member_id AND ${gone("w")})`,
      ),
      db.prepare(`DELETE FROM member_words WHERE ${gone("member_words")}`),
      db.prepare(`DELETE FROM member_names WHERE ${gone("member_names")}`),
      db.prepare(`DELETE FROM member_prayers WHERE ${gone("member_prayers")}`),
    ])
    .catch((e) => console.error("erase member bin:", e));
}
