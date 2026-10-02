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

-- Bible study notes from the private dashboard (/dashboard/notes). One row
-- per note so the list can grow without limit. Ordered by the page in the
-- owner's chronological Bible, then by the order they were written (seq).
CREATE TABLE IF NOT EXISTS study_notes (
  id         TEXT PRIMARY KEY,
  page       INTEGER,             -- chronological Bible page (nullable)
  seq        INTEGER NOT NULL,    -- order written; breaks ties within a page
  book       INTEGER,             -- 1-66, canonical order (nullable)
  chapter    INTEGER,
  verse      INTEGER,
  verse_end  INTEGER,
  text       TEXT NOT NULL,
  created_at INTEGER NOT NULL,    -- epoch ms
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_study_notes_order ON study_notes(page, seq);
