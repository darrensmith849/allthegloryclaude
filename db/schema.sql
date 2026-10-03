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
CREATE INDEX IF NOT EXISTS idx_study_notes_day ON study_notes(day, position, seq);

-- Each reading day's own details: a title and key takeaway, and whether the
-- day is included when the study is shared. Edits keep their old version.
CREATE TABLE IF NOT EXISTS study_days (
  day        TEXT PRIMARY KEY,    -- YYYY-MM-DD
  title      TEXT,
  takeaway   TEXT,
  shared     INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,    -- epoch ms
  read_at    INTEGER              -- ticked "read" (ALTER TABLE study_days ADD COLUMN read_at INTEGER)
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

-- ── The Study: member accounts ───────────────────────────────────
-- People who join /study get their own journal (notes, words, day titles)
-- in the member_* tables, kept apart from the owner's study_* tables so a
-- member's data can never touch the owner's. Every member_* row carries
-- member_id and every query filters on it.

CREATE TABLE IF NOT EXISTS members (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,  -- lower-cased
  name        TEXT NOT NULL,
  hash        TEXT NOT NULL,         -- PBKDF2-SHA256, base64url
  salt        TEXT NOT NULL,
  iterations  INTEGER NOT NULL,
  invite_code TEXT,                  -- the invite used to join, if any
  created_at  INTEGER NOT NULL,      -- epoch ms
  last_seen   INTEGER,
  disabled_at INTEGER,               -- set by the owner; can't log in
  role        TEXT                   -- 'helper' = may answer members' questions (ALTER TABLE members ADD COLUMN role TEXT)
);

-- Logged-in devices. Only a SHA-256 of the cookie token is stored.
CREATE TABLE IF NOT EXISTS member_sessions (
  token_hash TEXT PRIMARY KEY,
  member_id  TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_member_sessions_member ON member_sessions(member_id);

-- Invite links the owner makes on /dashboard/members.
CREATE TABLE IF NOT EXISTS member_invites (
  code       TEXT PRIMARY KEY,
  label      TEXT,
  max_uses   INTEGER,                -- NULL = unlimited
  uses       INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  revoked_at INTEGER,
  member_id  TEXT                    -- a member's own "invite a friend" link (ALTER TABLE member_invites ADD COLUMN member_id TEXT)
);
CREATE INDEX IF NOT EXISTS idx_member_invites_member ON member_invites(member_id);

-- One-time password reset links the owner makes for a member.
CREATE TABLE IF NOT EXISTS member_resets (
  token_hash TEXT PRIMARY KEY,
  member_id  TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at    INTEGER
);

-- Owner's switches for the study: signup ('invite' | 'open' | 'closed'),
-- reading ('off' | 'members' | 'public'), author, intro.
CREATE TABLE IF NOT EXISTS study_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS member_notes (
  id         TEXT PRIMARY KEY,
  member_id  TEXT NOT NULL,
  day        TEXT,
  page       INTEGER,
  seq        INTEGER NOT NULL,
  position   REAL,
  deleted_at INTEGER,
  private    INTEGER NOT NULL DEFAULT 0,
  book       INTEGER,
  chapter    INTEGER,
  verse      INTEGER,
  verse_end  INTEGER,
  text       TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_member_notes_member ON member_notes(member_id, updated_at);

CREATE TABLE IF NOT EXISTS member_note_versions (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id   TEXT NOT NULL,
  member_id TEXT NOT NULL,
  day       TEXT,
  page      INTEGER,
  book      INTEGER,
  chapter   INTEGER,
  verse     INTEGER,
  verse_end INTEGER,
  text      TEXT NOT NULL,
  saved_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_member_note_versions_member ON member_note_versions(member_id, note_id);

CREATE TABLE IF NOT EXISTS member_words (
  member_id  TEXT NOT NULL,
  id         TEXT NOT NULL,
  day        TEXT,
  word       TEXT NOT NULL,
  json       TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  PRIMARY KEY (member_id, id)
);
CREATE INDEX IF NOT EXISTS idx_member_words_updated ON member_words(member_id, updated_at);

CREATE TABLE IF NOT EXISTS member_word_versions (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id TEXT NOT NULL,
  word_id   TEXT NOT NULL,
  json      TEXT NOT NULL,
  saved_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_member_word_versions_member ON member_word_versions(member_id, word_id);

CREATE TABLE IF NOT EXISTS member_days (
  member_id  TEXT NOT NULL,
  day        TEXT NOT NULL,
  title      TEXT,
  takeaway   TEXT,
  shared     INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  read_at    INTEGER,              -- ticked "read" (ALTER TABLE member_days ADD COLUMN read_at INTEGER)
  PRIMARY KEY (member_id, day)
);

CREATE TABLE IF NOT EXISTS member_day_versions (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id TEXT NOT NULL,
  day       TEXT NOT NULL,
  title     TEXT,
  takeaway  TEXT,
  shared    INTEGER,
  saved_at  INTEGER NOT NULL
);

-- AI word fills used per day, per member and in total, so members share
-- the free Workers AI allowance fairly. who = member id or '*members'.
CREATE TABLE IF NOT EXISTS ai_usage (
  day TEXT NOT NULL,                 -- YYYY-MM-DD (UTC)
  who TEXT NOT NULL,
  n   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, who)
);

-- One email list for the owner: the site's newsletter sign-ups and Study
-- members who ticked "send me updates". Only people who asked are on it;
-- unsubscribing keeps the row with unsubscribed_at so it's never re-added
-- by mistake, and deleting a Study account removes it.
CREATE TABLE IF NOT EXISTS email_list (
  email           TEXT PRIMARY KEY,     -- lower-cased
  name            TEXT,
  source          TEXT NOT NULL,        -- 'newsletter' | 'study'
  subscribed_at   INTEGER NOT NULL,     -- epoch ms
  unsubscribed_at INTEGER
);

-- ── The Study: members-only sharing ───────────────────────────────
-- Reflections on a day's reading and testimonies. Members only - never on
-- the public site. Each post needs the member's consent tick, can be
-- anonymous, waits for the owner's approval before anyone sees it, and can
-- be withdrawn (deleted) by its author at any time.
CREATE TABLE IF NOT EXISTS community_posts (
  id          TEXT PRIMARY KEY,
  kind        TEXT NOT NULL,                    -- 'reflection' | 'testimony'
  member_id   TEXT NOT NULL,
  author_name TEXT,                             -- first name; NULL = anonymous
  day         TEXT,                             -- reflection: reading day YYYY-MM-DD
  ref         TEXT,                             -- reflection: passage, e.g. "John 4:10"
  title       TEXT,                             -- testimony: optional title
  text        TEXT NOT NULL,
  note_id     TEXT,                             -- reflection: the journal note it was shared from
  status      TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'declined'
  consent_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  reviewed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_community_status ON community_posts(status, kind, created_at);
CREATE INDEX IF NOT EXISTS idx_community_member ON community_posts(member_id);

CREATE TABLE IF NOT EXISTS community_reports (
  post_id    TEXT NOT NULL,
  member_id  TEXT NOT NULL,
  reason     TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, member_id)
);

-- The owner's weekly reflection, and members' replies to its check-in
-- question - private: only the owner reads replies.
CREATE TABLE IF NOT EXISTS weekly_reflections (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  question     TEXT,
  published_at INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  deleted_at   INTEGER
);
CREATE TABLE IF NOT EXISTS checkin_replies (
  id            TEXT PRIMARY KEY,
  reflection_id TEXT NOT NULL,
  member_id     TEXT NOT NULL,
  text          TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  read_at       INTEGER
);
CREATE INDEX IF NOT EXISTS idx_checkin_reflection ON checkin_replies(reflection_id, created_at);


-- Members' questions. Asked privately; only the owner or a helper answers.
-- Members can't comment on anything. The owner (or a helper) may publish an
-- answered question as a Q&A for all members - the asker is never named.
CREATE TABLE IF NOT EXISTS community_questions (
  id            TEXT PRIMARY KEY,
  member_id     TEXT NOT NULL,
  asker_name    TEXT,                          -- first name, seen only by the owner / helpers
  text          TEXT NOT NULL,
  ref           TEXT,                          -- optional passage, e.g. "John 4:10"
  status        TEXT NOT NULL DEFAULT 'open',  -- 'open' | 'answered'
  answer        TEXT,
  answered_by   TEXT,                          -- 'owner' or the helper's member id
  answerer_name TEXT,
  answered_at   INTEGER,
  published     INTEGER NOT NULL DEFAULT 0,    -- 1 = shown to all members as a Q&A
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_questions_status ON community_questions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_questions_member ON community_questions(member_id);
