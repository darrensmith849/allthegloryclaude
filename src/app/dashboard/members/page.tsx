"use client";

// The owner's controls for The Study (/study): who can join, who can read
// the owner's study, invite links, and the people who have joined.

import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { GrowingTextarea } from "@/components/dashboard/growing-textarea";
import { ShareLink } from "@/components/study/share-link";
import type { ReadingMode, SignupMode, StudySettings } from "@/lib/study/members";
import { EmailHealth } from "@/components/dashboard/email-health";
import { useDashUser } from "@/lib/dashboard/who";

interface Invite {
  code: string;
  label: string;
  maxUses: number | null;
  uses: number;
  createdAt: number;
  revoked: boolean;
  byMember?: boolean;
  team?: boolean;
}
interface MemberRow {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  lastSeen: number | null;
  disabled: boolean;
  notes: number;
  days: number;
  words: number;
  emailUpdates: boolean;
  helper: boolean;
  team?: boolean;
  invitedVia: string | null;
}
interface Backup {
  key: string;
  size: number;
  at: number;
  rows: number;
  reason: string;
}
interface Subscriber {
  email: string;
  name: string;
  source: string;
  subscribedAt: number;
}
interface EmailCounts {
  total: number;
  study: number;
  newsletter: number;
}

const SIGNUP: { value: SignupMode; label: string; hint: string }[] = [
  { value: "invite", label: "Invite link", hint: "Only people you send a link to can join." },
  { value: "open", label: "Anyone", hint: "Anyone can make an account on The Study page." },
  { value: "closed", label: "Nobody", hint: "No new accounts. Members already in keep their journal." },
];
const READING: { value: ReadingMode; label: string; hint: string }[] = [
  { value: "off", label: "Only you", hint: "Your notes stay private. Members keep their own journal only." },
  { value: "members", label: "Members", hint: "Signed-in members can read your study, day by day." },
  { value: "public", label: "Everyone", hint: "Anyone with the link can read your study - no account needed." },
];

const when = (ms: number | null) =>
  ms ? new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-";

async function api<T>(method: string, body?: unknown, query = ""): Promise<T> {
  const r = await fetch(`/api/members${query}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (r.status === 401) {
    window.location.assign("/dashboard/login?next=/dashboard/members");
    throw new Error("Please log in again.");
  }
  const data = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(data.error ?? `Request failed (${r.status})`);
  return data;
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="dash-members-link">
      <code>{url}</code>
      <button
        type="button"
        className="dash-btn dash-btn-ghost dash-note-nav"
        onClick={() => {
          void navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}

export default function MembersPage() {
  const [settings, setSettings] = useState<StudySettings | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  // Team members can use this page too; only Daniel gives out roles.
  const isOwner = useDashUser()?.role === "owner";
  const [emailList, setEmailList] = useState<EmailCounts | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subQuery, setSubQuery] = useState("");
  const [backups, setBackups] = useState<{ count: number; list: Backup[]; last: { at: number; rows: number } | null } | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [showBackups, setShowBackups] = useState(false);

  function loadBackups() {
    fetch("/api/members/backup", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { count: number; backups: Backup[]; last: { at: number; rows: number } | null } | null) =>
        setBackups(d ? { count: d.count, list: d.backups, last: d.last } : { count: 0, list: [], last: null }),
      )
      .catch(() => setBackups({ count: 0, list: [], last: null }));
  }
  async function backUpNow() {
    setBackingUp(true);
    try {
      const r = await fetch("/api/members/backup", { method: "POST" });
      if (!r.ok) throw new Error();
      loadBackups();
    } catch {
      alert("Couldn't back up just now - try again in a moment.");
    } finally {
      setBackingUp(false);
    }
  }
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [author, setAuthor] = useState("");
  const [intro, setIntro] = useState("");
  const [savedText, setSavedText] = useState(false);
  const [inviteLabel, setInviteLabel] = useState("");
  const [inviteMany, setInviteMany] = useState(false);
  const [inviteTeam, setInviteTeam] = useState(false);
  const [newInvite, setNewInvite] = useState<string | null>(null);
  const [resetLinks, setResetLinks] = useState<Record<string, string>>({});
  const [showStopped, setShowStopped] = useState(false);

  function load() {
    api<{ settings: StudySettings; invites: Invite[]; members: MemberRow[]; emailList: EmailCounts; subscribers: Subscriber[] }>("GET")
      .then((d) => {
        setSettings(d.settings);
        setAuthor(d.settings.author);
        setIntro(d.settings.intro);
        setInvites(d.invites);
        setMembers(d.members);
        setEmailList(d.emailList);
        setSubscribers(d.subscribers ?? []);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }
  useEffect(() => {
    setOrigin(window.location.origin);
    load();
    loadBackups();
  }, []);

  async function saveSettings(patch: Partial<StudySettings>) {
    try {
      const { settings: s } = await api<{ settings: StudySettings }>("PATCH", { settings: patch });
      setSettings(s);
      return true;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't save that.");
      return false;
    }
  }

  async function makeInvite() {
    try {
      const { invite } = await api<{ invite: Invite }>("POST", {
        invite: { label: inviteLabel, maxUses: inviteMany && !inviteTeam ? null : 1, team: inviteTeam },
      });
      setInvites((list) => [invite, ...list]);
      setNewInvite(invite.code);
      setInviteLabel("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't make that link.");
    }
  }

  async function stopInvite(code: string) {
    if (!confirm("Stop this invite link working? Anyone who already joined keeps their account.")) return;
    await api("DELETE", undefined, `?invite=${encodeURIComponent(code)}`).catch(() => {});
    setInvites((list) => list.map((i) => (i.code === code ? { ...i, revoked: true } : i)));
  }

  async function resetLink(m: MemberRow) {
    try {
      const { path } = await api<{ path: string }>("POST", { reset: m.id });
      setResetLinks((r) => ({ ...r, [m.id]: `${origin}${path}` }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't make a reset link.");
    }
  }

  async function unsubscribe(sub: Subscriber) {
    if (!confirm(`Take ${sub.email} off the email list? Do this when someone asks to stop getting emails.`)) return;
    try {
      await api("PATCH", { unsubscribe: sub.email });
      setSubscribers((list) => list.filter((x) => x.email !== sub.email));
      setMembers((list) => list.map((m) => (m.email === sub.email ? { ...m, emailUpdates: false } : m)));
      setEmailList((c) => c && { ...c, total: c.total - 1, [sub.source === "The Study" ? "study" : "newsletter"]: c[sub.source === "The Study" ? "study" : "newsletter"] - 1 });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't change that.");
    }
  }

  async function setHelper(m: MemberRow, helper: boolean) {
    if (helper && !confirm(`Make ${m.name} a helper? They'll be able to answer members' questions (you see every answer).`)) return;
    try {
      await api("PATCH", { member: m.id, helper });
      setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, helper } : x)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't change that.");
    }
  }

  async function setTeam(m: MemberRow, team: boolean) {
    if (
      team &&
      !confirm(
        `Put ${m.name} on your team? With their Study account they can open the dashboard - their own Study Notes (private to them), Members and Community - and answer questions. Nothing else.`,
      )
    )
      return;
    try {
      await api("PATCH", { member: m.id, team });
      setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, team, helper: team } : x)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't change that.");
    }
  }

  async function setPaused(m: MemberRow, disabled: boolean) {
    if (disabled && !confirm(`Pause ${m.name}'s account? They'll be logged out and can't log in until you un-pause it. Nothing is deleted.`)) return;
    try {
      await api("PATCH", { member: m.id, disabled });
      setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, disabled } : x)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't change that.");
    }
  }

  const inviteUrl = (code: string) => `${origin}/the-study?invite=${code}`;
  const liveInvites = invites.filter((i) => !i.revoked && (i.maxUses == null || i.uses < i.maxUses));
  // The link to pass on: The Study page when anyone can join, otherwise a
  // standing invite link that lets many people join.
  const everyday = liveInvites.find((i) => i.maxUses == null && !i.byMember);
  const shareUrl =
    settings?.signup === "open" ? `${origin}/the-study` : settings?.signup === "invite" && everyday ? inviteUrl(everyday.code) : null;

  async function makeEveryday() {
    try {
      const { invite } = await api<{ invite: Invite }>("POST", { invite: { label: "Everyday link", maxUses: null } });
      setInvites((list) => [invite, ...list]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't make that link.");
    }
  }
  const oldInvites = invites.filter((i) => !liveInvites.includes(i));

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">The Study · {origin.replace(/^https?:\/\//, "")}/the-study</div>
          <h1 className="dash-title mt-1">Members</h1>
          <div className="dash-subtitle">
            People who keep their own Bible study journal on your site - and, when you open it, read yours.
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isOwner && (
            <a className="dash-btn dash-btn-ghost" href="/dashboard/notes/read">
              Preview your study
            </a>
          )}
          <a className="dash-btn dash-btn-ghost" href="/the-study" target="_blank" rel="noreferrer">
            Open The Study page ↗
          </a>
        </div>
      </div>

      {error && <div className="dash-word-note mb-4">{error}</div>}

      <div className="dash-grid">
        <div className="dash-col-12">
          <Panel eyebrow="Your link" title="Share The Study">
            {settings?.signup === "closed" ? (
              <p className="dash-word-hint">Joining is set to Nobody, so there&apos;s nothing to share right now.</p>
            ) : shareUrl ? (
              <>
                <p className="dash-word-hint mb-3">
                  {settings?.signup === "open"
                    ? "Anyone with this link can read about The Study and join."
                    : "Joining is by invite - this everyday link lets anyone you send it to join."}
                </p>
                <ShareLink
                  url={shareUrl}
                  subject="Join me in The Study"
                  message="I'm reading through the Bible in the order it happened with The Study from All The Glory - come and read along:"
                />
              </>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <p className="dash-word-hint">Joining is by invite. Make one link you can give to anyone.</p>
                <button type="button" className="dash-btn dash-btn-primary dash-note-nav" onClick={makeEveryday}>
                  Make an everyday link
                </button>
              </div>
            )}
          </Panel>
        </div>

        {isOwner && (
        <div className="dash-col-6">
          <Panel eyebrow="Switches" title="Who can join">
            <div className="dash-toggle dash-members-toggle" role="group" aria-label="Who can join">
              {SIGNUP.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={settings?.signup === o.value ? "is-on" : ""}
                  onClick={() => saveSettings({ signup: o.value })}
                  disabled={!settings}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="dash-word-hint mt-2">{SIGNUP.find((o) => o.value === settings?.signup)?.hint}</p>

            <div className="dash-divider" />
            <div className="eyebrow mb-2">Who can read your study</div>
            <div className="dash-toggle dash-members-toggle" role="group" aria-label="Who can read your study">
              {READING.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={settings?.reading === o.value ? "is-on" : ""}
                  onClick={() => {
                    if (
                      o.value === "public" &&
                      !confirm("Let anyone read your study (no account needed)? Private notes and days you've kept back stay hidden.")
                    )
                      return;
                    void saveSettings({ reading: o.value });
                  }}
                  disabled={!settings}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="dash-word-hint mt-2">
              {READING.find((o) => o.value === settings?.reading)?.hint} Private notes (🔒) and days you keep back are
              never shown.
            </p>

            <div className="dash-divider" />
            <label className="dash-label" htmlFor="m-author">
              Your name on the study
            </label>
            <input
              id="m-author"
              className="dash-input"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="All The Glory"
            />
            <label className="dash-label mt-3" htmlFor="m-intro">
              Welcome line · optional
            </label>
            <GrowingTextarea
              id="m-intro"
              className="dash-textarea dash-word-field"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="e.g. Reading through the Bible in the order it happened - my notes, one day at a time."
            />
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                className="dash-btn dash-btn-primary"
                disabled={!settings || (author === settings.author && intro === settings.intro)}
                onClick={async () => {
                  if (await saveSettings({ author, intro })) {
                    setSavedText(true);
                    window.setTimeout(() => setSavedText(false), 2500);
                  }
                }}
              >
                Save
              </button>
              {savedText && <span className="dash-word-hint">Saved ✓</span>}
            </div>
          </Panel>
        </div>
        )}

        <div className="dash-col-6">
          <Panel eyebrow="Invite links" title="Invite someone">
            <p className="dash-word-hint mb-3">
              Send a link - whoever opens it can make an account
              {settings?.signup === "closed" ? " (once you switch joining back on)" : ""}.
            </p>
            <input
              className="dash-input"
              placeholder="Who it's for, e.g. My study partner"
              value={inviteLabel}
              onChange={(e) => setInviteLabel(e.target.value)}
            />
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className="dash-toggle" role="group" aria-label="How many people">
                <button type="button" className={!inviteMany ? "is-on" : ""} onClick={() => setInviteMany(false)}>
                  One person
                </button>
                <button
                  type="button"
                  className={inviteMany && !inviteTeam ? "is-on" : ""}
                  onClick={() => {
                    setInviteMany(true);
                    setInviteTeam(false);
                  }}
                >
                  Many people
                </button>
              </div>
              {isOwner && (
                <label className="dash-print-check" title="They join your team: their own Study Notes, Members and Community in the dashboard">
                  <input
                    type="checkbox"
                    checked={inviteTeam}
                    onChange={(e) => {
                      setInviteTeam(e.target.checked);
                      if (e.target.checked) setInviteMany(false);
                    }}
                  />{" "}
                  On my team (admin)
                </label>
              )}
              <button type="button" className="dash-btn dash-btn-primary" onClick={makeInvite}>
                Make link
              </button>
            </div>
            {newInvite && (
              <div className="mt-3">
                <div className="dash-word-saved mb-2">✓ Link ready - copy it and send it</div>
                <CopyLink url={inviteUrl(newInvite)} />
              </div>
            )}

            {liveInvites.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                <div className="eyebrow">Working links</div>
                {liveInvites.map((i) => (
                  <div key={i.code} className="dash-members-row">
                    <div className="min-w-0">
                      <div className="dash-members-name">{i.label || "Invite"}</div>
                      <div className="dash-word-hint">
                        {i.team ? "Team invite · one person · " : ""}
                        {i.maxUses == null ? `Many people · used ${i.uses}×` : `${i.team ? "" : "One person · "}not used yet`} · made {when(i.createdAt)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="dash-btn dash-btn-ghost dash-note-nav"
                        onClick={() => void navigator.clipboard?.writeText(inviteUrl(i.code))}
                      >
                        Copy
                      </button>
                      <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => stopInvite(i.code)}>
                        Stop
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {oldInvites.length > 0 && (
              <button type="button" className="dash-word-link mt-3" onClick={() => setShowStopped((v) => !v)}>
                {showStopped ? "Hide" : "Show"} used and stopped links · {oldInvites.length}
              </button>
            )}
            {showStopped &&
              oldInvites.map((i) => (
                <div key={i.code} className="dash-members-row is-muted">
                  <div className="dash-members-name">{i.label || "Invite"}</div>
                  <div className="dash-word-hint">
                    {i.revoked ? "Stopped" : "Used"} · {i.uses}× · {when(i.createdAt)}
                  </div>
                </div>
              ))}
          </Panel>
        </div>

        <div className="dash-col-12">
          <Panel
            eyebrow="Staying in touch"
            title={`Your email list${emailList ? ` · ${emailList.total}` : ""}`}
            action={
              <div className="flex gap-2 flex-wrap">
                <a className="dash-btn dash-btn-primary dash-note-nav" href="/api/members?export=list">
                  Download list (CSV)
                </a>
                <a className="dash-btn dash-btn-ghost dash-note-nav" href="/api/members?export=members">
                  All members (CSV)
                </a>
              </div>
            }
          >
            <p className="dash-word-hint">
              {emailList
                ? `Everyone who said yes to email updates - ${emailList.study} from The Study, ${emailList.newsletter} from the newsletter box on the site.`
                : "Loading…"}{" "}
              Only send news to this list. The CSV imports straight into Brevo.
            </p>
            <EmailHealth />
            {subscribers.length > 6 && (
              <input
                type="search"
                className="dash-input mt-3"
                placeholder="Search by name or email"
                value={subQuery}
                onChange={(e) => setSubQuery(e.target.value)}
              />
            )}
            {subscribers.length === 0 ? (
              <p className="dash-word-hint mt-3">Nobody yet.</p>
            ) : (
              <div className="dash-email-table">
                <div className="dash-email-row is-head">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Signed up from</span>
                  <span>Since</span>
                  <span />
                </div>
                {subscribers
                  .filter((sub) =>
                    !subQuery.trim()
                      ? true
                      : `${sub.name} ${sub.email}`.toLowerCase().includes(subQuery.trim().toLowerCase()),
                  )
                  .map((sub) => (
                    <div key={sub.email} className="dash-email-row">
                      <span className="dash-members-name">{sub.name || "-"}</span>
                      <a href={`mailto:${sub.email}`} className="dash-email-addr">
                        {sub.email}
                      </a>
                      <span>{sub.source}</span>
                      <span>{when(sub.subscribedAt)}</span>
                      <button type="button" className="dash-word-link" onClick={() => unsubscribe(sub)}>
                        Remove
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="dash-col-12">
          <Panel eyebrow={`${members.length} ${members.length === 1 ? "person" : "people"}`} title="Members">
            {members.length === 0 && (
              <p className="dash-word-hint">Nobody has joined yet. Make an invite link and send it to someone.</p>
            )}
            <div className="flex flex-col gap-2">
              {members.map((m) => (
                <div key={m.id} className={`dash-members-row ${m.disabled ? "is-muted" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <div className="dash-members-name">
                      {m.name} {m.emailUpdates && <span className="dash-email-badge">✉ Email updates</span>}{" "}
                      {m.team ? <span className="dash-team-badge">Team</span> : m.helper && <span className="dash-helper-badge">Helper</span>}{" "}
                      {m.disabled && <span className="dash-word-hint">· paused</span>}
                    </div>
                    <div className="dash-word-hint">
                      {m.email} · joined {when(m.createdAt)} · last here {when(m.lastSeen)}
                    </div>
                    <div className="dash-word-hint">
                      {m.notes} notes across {m.days} days · {m.words} words
                      {m.invitedVia ? ` · joined via ${m.invitedVia.startsWith("From ") ? m.invitedVia.replace(/^From /, "") + "'s link" : m.invitedVia}` : ""}
                    </div>
                    {resetLinks[m.id] && (
                      <div className="mt-2">
                        <div className="dash-word-hint mb-1">
                          One-time link to set a new password (works for 7 days) - send it to {m.name}:
                        </div>
                        <CopyLink url={resetLinks[m.id]} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {isOwner && (
                      <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => setTeam(m, !m.team)}>
                        {m.team ? "Remove from team" : "Make team"}
                      </button>
                    )}
                    {isOwner && !m.team && (
                      <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => setHelper(m, !m.helper)}>
                        {m.helper ? "Remove helper" : "Make helper"}
                      </button>
                    )}
                    <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => resetLink(m)}>
                      Reset link
                    </button>
                    <button
                      type="button"
                      className="dash-btn dash-btn-ghost dash-note-nav"
                      onClick={() => setPaused(m, !m.disabled)}
                    >
                      {m.disabled ? "Un-pause" : "Pause"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="dash-word-hint mt-4">
              Members&apos; journals are theirs - you see only counts here, never their notes.
            </p>
          </Panel>
        </div>
        {isOwner && (
        <div className="dash-col-12">
          <Panel
            eyebrow="Kept for good"
            title="Backups"
            action={
              <button type="button" className="dash-btn dash-btn-primary dash-note-nav" disabled={backingUp} onClick={backUpNow}>
                {backingUp ? "Backing up…" : "Back up now"}
              </button>
            }
          >
            <p className="dash-word-hint">
              Everything in The Study - your study, every member&apos;s journal, their words and days, questions, testimonies
              and the email list - is kept for good; only a member deleting their own account removes theirs. On top of
              that, a full copy is saved every night at 04:00 to your own private storage, and each copy is kept for a
              year (download any copy to keep it longer). Passwords are never copied - after a restore, members use
              &quot;Forgotten your password?&quot;.
            </p>
            {backups === null ? (
              <p className="dash-word-hint mt-3">Loading…</p>
            ) : (
              <>
                <p className="dash-backup-last">
                  {backups.last
                    ? `Last backup: ${new Date(backups.last.at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} · ${backups.last.rows.toLocaleString()} records`
                    : "No backup yet - the first runs tonight, or tap Back up now."}
                  {backups.count > 0 && ` · ${backups.count} ${backups.count === 1 ? "copy" : "copies"} kept`}
                </p>
                {backups.list.length > 0 && (
                  <button type="button" className="dash-word-link mt-2" onClick={() => setShowBackups((v) => !v)}>
                    {showBackups ? "Hide" : "Show"} backups
                  </button>
                )}
                {showBackups && (
                  <div className="dash-email-table">
                    {backups.list.map((b) => (
                      <div key={b.key} className="dash-backup-row">
                        <span className="dash-members-name">
                          {new Date(b.at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>{b.reason === "manual" ? "Backed up by you" : "Nightly"}</span>
                        <span>{b.rows.toLocaleString()} records · {(b.size / 1024).toFixed(0)} KB</span>
                        <a className="dash-word-link" href={`/api/members/backup?key=${encodeURIComponent(b.key)}`}>
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </Panel>
        </div>
        )}
      </div>
    </>
  );
}
