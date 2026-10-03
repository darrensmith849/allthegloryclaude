-- Durable analytics store (Cloudflare D1). Idempotent — safe to re-run.

-- Page views + album downloads. One row per event.
CREATE TABLE IF NOT EXISTS events (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  type    TEXT NOT NULL,          -- 'view' | 'download' | 'play' | 'link'
  path    TEXT,                   -- request path (views)
  file    TEXT,                   -- file key (downloads) / track (plays)
  country TEXT,                   -- cf-ipcountry, best effort
  sid     TEXT,                   -- anonymous session id (visitor de-dupe)
  ts      INTEGER NOT NULL,       -- epoch ms
  ref     TEXT,                   -- referrer source hostname / 'direct' (views)
  device  TEXT,                   -- 'mobile' | 'tablet' | 'desktop' (views)
  city    TEXT,                   -- Cloudflare cf.city, best effort (may be null)
  region  TEXT                    -- Cloudflare cf.region (state/province)
);
CREATE INDEX IF NOT EXISTS idx_events_type_ts ON events(type, ts);
CREATE INDEX IF NOT EXISTS idx_events_sid_ts  ON events(sid, ts);

-- Confirmed donations (money given via Paystack). Reference is Paystack's
-- unique transaction reference, so re-verifying the same payment is a no-op
-- (INSERT OR IGNORE) and can never double-count.
CREATE TABLE IF NOT EXISTS donations (
  reference TEXT PRIMARY KEY,
  amount    INTEGER NOT NULL,     -- minor units (e.g. cents)
  currency  TEXT,
  email     TEXT,
  ts        INTEGER NOT NULL      -- epoch ms
);
CREATE INDEX IF NOT EXISTS idx_donations_ts ON donations(ts);

-- The owner's private dashboard state (streak, habits, tasks, fast, etc.).
-- Single row (id='owner') holding the whole JSON blob, so it's durable +
-- syncs across browsers/devices instead of living only in localStorage.
CREATE TABLE IF NOT EXISTS dashboard_state (
  id         TEXT PRIMARY KEY,
  json       TEXT NOT NULL,
  updated_at INTEGER NOT NULL     -- epoch ms; last-write-wins
);

-- The dashboard state as it stood at the end of each day (UTC), kept
-- forever - a year-by-year record and a restore point if anything goes wrong.
CREATE TABLE IF NOT EXISTS dashboard_state_history (
  day        TEXT PRIMARY KEY,    -- YYYY-MM-DD
  json       TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Bible study notes from the private dashboard (/dashboard/notes). One row
-- per note so the list can grow without limit. Ordered by reading-plan day,
-- then page, then position (the order the owner arranges them in).
-- Nothing is ever removed: deleting sets deleted_at (restorable from
-- "Recently deleted"), and every edit keeps the old version in
-- study_note_versions.
-- day/position/deleted_at were added after the table first shipped; on an
-- existing database run:
--   ALTER TABLE study_notes ADD COLUMN day TEXT;
--   ALTER TABLE study_notes ADD COLUMN position REAL;
--   ALTER TABLE study_notes ADD COLUMN deleted_at INTEGER;
--   ALTER TABLE study_notes ADD COLUMN private INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS study_notes (
  id         TEXT PRIMARY KEY,
  day        TEXT,                -- reading-plan day, YYYY-MM-DD (nullable)
  page       INTEGER,             -- chronological Bible page (nullable)
  seq        INTEGER NOT NULL,    -- order written
  position   REAL,                -- order within a day/page; starts as seq
  deleted_at INTEGER,             -- epoch ms when moved to Recently deleted
  private    INTEGER NOT NULL DEFAULT 0, -- 1 = never included when the study is shared
  book       INTEGER,             -- 1-66, canonical order (nullable)
  chapter    INTEGER,
  verse      INTEGER,
  verse_end  INTEGER,
  text       TEXT NOT NULL,
  created_at INTEGER NOT NULL,    -- epoch ms
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_study_notes_order ON study_notes(page, seq);
CREATE INDEX IF NOT EXISTS idx_study_notes_updated ON study_notes(updated_at);

-- Each reading day's own details: a title and key takeaway, and whether the
-- day is included when the study is shared. Edits keep their old version.
CREATE TABLE IF NOT EXISTS study_days (
  day        TEXT PRIMARY KEY,    -- YYYY-MM-DD
  title      TEXT,
  takeaway   TEXT,
  shared     INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL     -- epoch ms
);
CREATE TABLE IF NOT EXISTS study_day_versions (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  day      TEXT NOT NULL,
  title    TEXT,
  takeaway TEXT,
  shared   INTEGER,
  saved_at INTEGER NOT NULL
);

-- Every earlier version of an edited study note, so an edit never loses text.
CREATE TABLE IF NOT EXISTS study_note_versions (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id   TEXT NOT NULL,
  day       TEXT,
  page      INTEGER,
  book      INTEGER,
  chapter   INTEGER,
  verse     INTEGER,
  verse_end INTEGER,
  text      TEXT NOT NULL,
  saved_at  INTEGER NOT NULL      -- epoch ms the version was replaced
);
CREATE INDEX IF NOT EXISTS idx_study_note_versions_note ON study_note_versions(note_id, saved_at);

-- Failed dashboard logins, for brute-force lockout (/api/admin/login).
-- Rows older than a day are cleared on each failure.
CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT NOT NULL,
  ts INTEGER NOT NULL             -- epoch ms
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_ts ON login_attempts(ip, ts);

-- Dashboard admin password, set on the dashboard's login screen. Only a
-- PBKDF2-SHA256 hash with a random salt is stored. One row: id='owner'.
CREATE TABLE IF NOT EXISTS admin_auth (
  id         TEXT PRIMARY KEY,
  hash       TEXT NOT NULL,       -- base64url
  salt       TEXT NOT NULL,       -- base64url
  iterations INTEGER NOT NULL,
  updated_at INTEGER NOT NULL     -- epoch ms
);

-- Word journal entries (dashboard Word Journal / Study Notes), one row per
-- word so the journal can grow for years. json is the full entry. Nothing
-- is ever removed: deleting sets deleted_at, and edits keep the old version
-- in study_word_versions. Words saved before this table existed are copied
-- in from the dashboard_state blob the first time /api/words is read.
CREATE TABLE IF NOT EXISTS study_words (
  id         TEXT PRIMARY KEY,
  day        TEXT,                -- reading day it was studied on (nullable)
  word       TEXT NOT NULL,
  json       TEXT NOT NULL,
  created_at INTEGER NOT NULL,    -- epoch ms
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER              -- epoch ms when moved to Recently deleted
);
CREATE INDEX IF NOT EXISTS idx_study_words_day ON study_words(day);
CREATE INDEX IF NOT EXISTS idx_study_words_updated ON study_words(updated_at);

CREATE TABLE IF NOT EXISTS study_word_versions (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id  TEXT NOT NULL,
  json     TEXT NOT NULL,
  saved_at INTEGER NOT NULL       -- epoch ms the version was replaced
);
CREATE INDEX IF NOT EXISTS idx_study_word_versions_word ON study_word_versions(word_id, saved_at);
