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
  device  TEXT                    -- 'mobile' | 'tablet' | 'desktop' (views)
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
