"use client";

// The owner's controls for The Study (/study): who can join, who can read
// the owner's study, invite links, and the people who have joined.

import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { GrowingTextarea } from "@/components/dashboard/growing-textarea";
import type { ReadingMode, SignupMode, StudySettings } from "@/lib/study/members";

interface Invite {
  code: string;
  label: string;
  maxUses: number | null;
  uses: number;
  createdAt: number;
  revoked: boolean;
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
}

const SIGNUP: { value: SignupMode; label: string; hint: string }[] = [
  { value: "invite", label: "Invite link", hint: "Only people you send a link to can join." },
  { value: "open", label: "Anyone", hint: "Anyone can make an account at /study." },
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
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [author, setAuthor] = useState("");
  const [intro, setIntro] = useState("");
  const [savedText, setSavedText] = useState(false);
  const [inviteLabel, setInviteLabel] = useState("");
  const [inviteMany, setInviteMany] = useState(false);
  const [newInvite, setNewInvite] = useState<string | null>(null);
  const [resetLinks, setResetLinks] = useState<Record<string, string>>({});
  const [showStopped, setShowStopped] = useState(false);

  function load() {
    api<{ settings: StudySettings; invites: Invite[]; members: MemberRow[] }>("GET")
      .then((d) => {
        setSettings(d.settings);
        setAuthor(d.settings.author);
        setIntro(d.settings.intro);
        setInvites(d.invites);
        setMembers(d.members);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }
  useEffect(() => {
    setOrigin(window.location.origin);
    load();
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
        invite: { label: inviteLabel, maxUses: inviteMany ? null : 1 },
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

  async function setPaused(m: MemberRow, disabled: boolean) {
    if (disabled && !confirm(`Pause ${m.name}'s account? They'll be logged out and can't log in until you un-pause it. Nothing is deleted.`)) return;
    try {
      await api("PATCH", { member: m.id, disabled });
      setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, disabled } : x)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't change that.");
    }
  }

  const inviteUrl = (code: string) => `${origin}/study/join?invite=${code}`;
  const liveInvites = invites.filter((i) => !i.revoked && (i.maxUses == null || i.uses < i.maxUses));
  const oldInvites = invites.filter((i) => !liveInvites.includes(i));

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">The Study · {origin.replace(/^https?:\/\//, "")}/study</div>
          <h1 className="dash-title mt-1">Members</h1>
          <div className="dash-subtitle">
            People who keep their own Bible study journal on your site - and, when you open it, read yours.
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a className="dash-btn dash-btn-ghost" href="/dashboard/notes/read">
            Preview your study
          </a>
          <a className="dash-btn dash-btn-ghost" href="/study" target="_blank" rel="noreferrer">
            Open /study ↗
          </a>
        </div>
      </div>

      {error && <div className="dash-word-note mb-4">{error}</div>}

      <div className="dash-grid">
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
                <button type="button" className={inviteMany ? "is-on" : ""} onClick={() => setInviteMany(true)}>
                  Many people
                </button>
              </div>
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
                        {i.maxUses == null ? `Many people · used ${i.uses}×` : `One person · not used yet`} · made {when(i.createdAt)}
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
          <Panel eyebrow={`${members.length} ${members.length === 1 ? "person" : "people"}`} title="Members">
            {members.length === 0 && (
              <p className="dash-word-hint">Nobody has joined yet. Make an invite link and send it to someone.</p>
            )}
            <div className="flex flex-col gap-2">
              {members.map((m) => (
                <div key={m.id} className={`dash-members-row ${m.disabled ? "is-muted" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <div className="dash-members-name">
                      {m.name} {m.disabled && <span className="dash-word-hint">· paused</span>}
                    </div>
                    <div className="dash-word-hint">
                      {m.email} · joined {when(m.createdAt)} · last here {when(m.lastSeen)}
                    </div>
                    <div className="dash-word-hint">
                      {m.notes} notes across {m.days} days · {m.words} words
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
      </div>
    </>
  );
}
