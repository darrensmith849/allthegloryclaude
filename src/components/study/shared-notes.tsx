"use client";

// Shared notes: a private group for a member and their friends, to share notes
// and compare what each of them saw in the same reading. Everything here is
// locked and unlocked in this browser (src/lib/study/shared-groups.ts): the
// server only ever hands over scrambled text, and only to people in the group.

import { useCallback, useEffect, useMemo, useState } from "react";
import { GrowingTextarea } from "@/components/dashboard/growing-textarea";
import { NoteText } from "@/components/dashboard/note-text";
import { Panel } from "@/components/dashboard/panel";
import { dayLabel, formatPassage, parsePassage, passageOf, planDay, verseOrder } from "@/lib/dashboard/notes";
import { bookDate, inPlan, planPage } from "@/lib/study/plan";
import {
  catchInvite,
  clearInvite,
  groupsCall,
  inviteLink,
  loadSecrets,
  newJoinCode,
  newSecret,
  parseInvite,
  pendingInvite,
  saveSecret,
  seal,
  unseal,
  type GroupNoteRow,
  type GroupPerson,
  type GroupRow,
  type Invite,
  type SharedNoteBody,
} from "@/lib/study/shared-groups";
import { PrivacyCard } from "./privacy-card";

const MAX_NOTE = 20_000;
const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
const words = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

async function nameIn(secret: string | undefined, sealed: string | undefined): Promise<string | null> {
  if (!secret || !sealed) return null;
  return unseal<{ name: string }>(secret, sealed)
    .then((v) => v.name)
    .catch(() => null);
}

type Shown = GroupRow & { name: string | null }; // no name = locked on this device

export function SharedNotes({ memberId, memberName }: { memberId: string; memberName: string }) {
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [groups, setGroups] = useState<Shown[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [justStarted, setJustStarted] = useState(false);
  const [invite, setInvite] = useState<(Invite & { id: string; name: string; people: number }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const keys = loadSecrets(memberId);
    setSecrets(keys);
    const { groups: rows } = await groupsCall<{ groups: GroupRow[] }>("GET");
    setGroups(await Promise.all(rows.map(async (g) => ({ ...g, name: await nameIn(keys[g.id], g.sealedName) }))));
  }, [memberId]);

  // A link: the group's name for the invitation - or, for someone already in
  // it on a new device, the key they were missing.
  const openLink = useCallback(
    async (link: Invite) => {
      setError(null);
      try {
        const d = await groupsCall<{ id: string; sealedName: string; people: number; already: boolean }>("POST", { action: "peek", link: link.code });
        const name = await nameIn(link.secret, d.sealedName);
        if (!name) throw new Error("This link isn't complete - ask for it again and copy all of it.");
        if (d.already) {
          saveSecret(memberId, d.id, link.secret);
          clearInvite();
          await reload();
          setOpenId(d.id);
          return;
        }
        setInvite({ ...link, id: d.id, name, people: d.people });
      } catch (e) {
        clearInvite();
        setError(words(e, "Couldn't open that link."));
      }
    },
    [memberId, reload],
  );

  useEffect(() => {
    catchInvite();
    const waiting = pendingInvite();
    void reload().catch((e) => {
      setGroups([]);
      setError(words(e, "Couldn't open your groups."));
    });
    if (waiting) void openLink(waiting);
    // A link opened while already on this page doesn't reload it.
    const onHash = () => {
      catchInvite();
      const link = pendingInvite();
      if (!link) return;
      setOpenId(null);
      void openLink(link);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [reload, openLink]);

  async function joined(id: string) {
    setInvite(null);
    await reload().catch(() => {});
    setOpenId(id);
  }

  const backToList = useCallback(
    async (message?: string) => {
      setOpenId(null);
      setJustStarted(false);
      setError(message ?? null);
      await reload().catch(() => {});
    },
    [reload],
  );

  if (openId && secrets[openId]) {
    return (
      <GroupView
        key={openId}
        id={openId}
        secret={secrets[openId]}
        justStarted={justStarted}
        onBack={backToList}
      />
    );
  }

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Locked - only your group can read them</div>
          <h1 className="dash-title mt-1">Shared notes</h1>
          <div className="dash-subtitle">
            A private group for you and your friends, to share your notes and compare what you each saw in the same reading. Your own
            journal stays yours - only the notes you choose go in.
          </div>
        </div>
      </div>

      <div className="dash-grid">
        {error && (
          <div className="dash-col-12">
            <p className="dash-starter-error" role="alert">
              {error}
            </p>
          </div>
        )}

        {invite && (
          <div className="dash-col-12">
            <JoinCard
              invite={invite}
              memberId={memberId}
              memberName={memberName}
              onJoined={joined}
              onNotNow={() => {
                clearInvite();
                setInvite(null);
              }}
            />
          </div>
        )}

        <div className="dash-col-12">
          <Panel eyebrow="Your groups" title={groups?.length ? "Open a group" : "No groups yet"}>
            {groups === null && <p className="dash-word-hint">Opening your groups…</p>}
            {groups?.length === 0 && <p className="dash-word-hint">Start one below and send the link to your friends. They&apos;ll join free.</p>}
            <div className="shared-groups">
              {groups?.map((g) =>
                g.name ? (
                  <button key={g.id} type="button" className="shared-group-card" onClick={() => setOpenId(g.id)}>
                    <span className="shared-group-name">{g.name}</span>
                    <span className="shared-group-count">
                      {g.people === 1 ? "Just you so far" : `${g.people} people`} · {g.notes === 1 ? "1 note" : `${g.notes} notes`}
                    </span>
                  </button>
                ) : (
                  <div key={g.id} className="shared-group-card is-locked">
                    <span className="shared-group-name">🔒 Locked on this device</span>
                    <span className="shared-group-count">Open this group&apos;s link here to unlock it, or paste it below.</span>
                  </div>
                ),
              )}
            </div>
          </Panel>
        </div>

        <div className="dash-col-12">
          <StartGroup
            memberId={memberId}
            memberName={memberName}
            onStarted={async (id) => {
              setJustStarted(true);
              await joined(id);
            }}
          />
        </div>

        <div className="dash-col-12">
          <Panel eyebrow="Got a link?" title="Join or unlock with a link">
            <PasteLink onLink={openLink} />
          </Panel>
        </div>

        <div className="dash-col-12">
          <PrivacyCard />
        </div>
      </div>
    </>
  );
}

// ── Joining and starting ─────────────────────────────────────────

function JoinCard({
  invite,
  memberId,
  memberName,
  onJoined,
  onNotNow,
}: {
  invite: Invite & { id: string; name: string; people: number };
  memberId: string;
  memberName: string;
  onJoined: (id: string) => void;
  onNotNow: () => void;
}) {
  const [myName, setMyName] = useState(firstName(memberName));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    if (!myName.trim()) return setError("Add the name your group knows you by.");
    setBusy(true);
    setError(null);
    try {
      const { id } = await groupsCall<{ id: string }>("POST", {
        action: "join",
        link: invite.code,
        myName: await seal(invite.secret, { name: myName.trim().slice(0, 60) }),
      });
      saveSecret(memberId, id, invite.secret);
      clearInvite();
      onJoined(id);
    } catch (e) {
      setError(words(e, "Couldn't join."));
      setBusy(false);
    }
  }

  return (
    <Panel eyebrow="You've been invited" title={invite.name} className="shared-invite">
      <p className="dash-word-hint">
        {invite.people === 1 ? "1 person is" : `${invite.people} people are`} in this group. They&apos;ll see the notes you choose to share,
        and the name you put here. Your own journal stays private.
      </p>
      <label className="dash-label mt-4" htmlFor="shared-join-name">
        Your name in this group
      </label>
      <input id="shared-join-name" className="dash-input" value={myName} maxLength={60} onChange={(e) => setMyName(e.target.value)} />
      <div className="flex gap-2 flex-wrap mt-3">
        <button type="button" className="dash-btn dash-btn-primary" onClick={join} disabled={busy}>
          {busy ? "Joining…" : "Join this group"}
        </button>
        <button type="button" className="dash-btn dash-btn-ghost" onClick={onNotNow} disabled={busy}>
          Not now
        </button>
      </div>
      {error && <p className="dash-starter-error">{error}</p>}
    </Panel>
  );
}

function StartGroup({ memberId, memberName, onStarted }: { memberId: string; memberName: string; onStarted: (id: string) => void }) {
  const [name, setName] = useState("");
  const [myName, setMyName] = useState(firstName(memberName));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (!name.trim()) return setError("Give your group a name.");
    if (!myName.trim()) return setError("Add the name your group knows you by.");
    setBusy(true);
    setError(null);
    try {
      const secret = newSecret();
      const code = newJoinCode();
      const { id } = await groupsCall<{ id: string }>("POST", {
        action: "create",
        link: code,
        sealedName: await seal(secret, { name: name.trim().slice(0, 80) }),
        sealedLink: await seal(secret, { code }),
        myName: await seal(secret, { name: myName.trim().slice(0, 60) }),
      });
      saveSecret(memberId, id, secret);
      setName("");
      onStarted(id);
    } catch (e) {
      setError(words(e, "Couldn't start the group."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel eyebrow="Start a group" title="A new shared group">
      <div className="shared-fields">
        <div>
          <label className="dash-label" htmlFor="shared-new-name">
            Group name
          </label>
          <input
            id="shared-new-name"
            className="dash-input"
            value={name}
            maxLength={80}
            placeholder="e.g. Tuesday Bible group"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="dash-label" htmlFor="shared-new-me">
            Your name in the group
          </label>
          <input id="shared-new-me" className="dash-input" value={myName} maxLength={60} onChange={(e) => setMyName(e.target.value)} />
        </div>
      </div>
      <p className="dash-word-hint mt-3">You&apos;ll get your group&apos;s link straight away, with a button to copy it and send it to friends.</p>
      <button type="button" className="dash-btn dash-btn-primary mt-3" onClick={start} disabled={busy}>
        {busy ? "Starting…" : "Start the group"}
      </button>
      {error && <p className="dash-starter-error">{error}</p>}
    </Panel>
  );
}

function PasteLink({ onLink }: { onLink: (invite: Invite) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <p className="dash-word-hint">Did a friend send you a group link? Paste all of it here to join. (Your own group&apos;s link is on the group, with a Copy button.)</p>
      <div className="flex gap-2 flex-wrap mt-3">
        <input
          className="dash-input shared-paste"
          value={text}
          placeholder="https://alltheglory.co.za/study/shared#join=…"
          aria-label="Your group's link"
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
        />
        <button
          type="button"
          className="dash-btn dash-btn-ghost"
          onClick={() => {
            if (!text.trim()) return setError("Paste the link your friend sent you first.");
            const link = parseInvite(text);
            if (!link) return setError("That isn't a whole group link - copy all of it and try again.");
            setText("");
            onLink(link);
          }}
        >
          Open
        </button>
      </div>
      {error && <p className="dash-starter-error">{error}</p>}
    </>
  );
}

// ── One group ────────────────────────────────────────────────────

interface Person extends GroupPerson {
  name: string;
}
interface Note extends GroupNoteRow {
  body: SharedNoteBody;
}

function dayTitle(day: string | null): string {
  if (!day) return "Not on a particular day";
  return inPlan(day) ? `Day ${planDay(day).n} · In the book: ${bookDate(day)}` : dayLabel(day);
}

function GroupView({
  id,
  secret,
  justStarted,
  onBack,
}: {
  id: string;
  secret: string;
  justStarted: boolean;
  onBack: (message?: string) => void;
}) {
  const [name, setName] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [unreadable, setUnreadable] = useState(0);
  const [who, setWho] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await groupsCall<{ group: { sealedName: string; sealedLink: string }; people: GroupPerson[]; notes: GroupNoteRow[] }>(
        "GET",
        undefined,
        `?group=${encodeURIComponent(id)}`,
      );
      setName(await nameIn(secret, d.group.sealedName));
      setCode((await unseal<{ code: string }>(secret, d.group.sealedLink).catch(() => null))?.code ?? null);
      setPeople(await Promise.all(d.people.map(async (p) => ({ ...p, name: (await nameIn(secret, p.sealedName)) ?? "Someone" }))));
      const opened = await Promise.all(
        d.notes.map(async (n) => {
          const body = await unseal<SharedNoteBody>(secret, n.sealed).catch(() => null);
          return body ? { ...n, body } : null;
        }),
      );
      setNotes(opened.filter((n): n is Note => Boolean(n)));
      setUnreadable(opened.filter((n) => !n).length);
    } catch (e) {
      onBack(words(e, "Couldn't open that group."));
    }
  }, [id, secret, onBack]);

  useEffect(() => {
    void load();
    // Back from WhatsApp or another app: show what's new.
    const again = () => void load();
    window.addEventListener("focus", again);
    return () => window.removeEventListener("focus", again);
  }, [load]);

  useEffect(() => window.scrollTo({ top: 0 }), []);

  const me = people.find((p) => p.me);
  const leader = Boolean(me?.leader);

  const shown = useMemo(() => (notes ?? []).filter((n) => who === "all" || n.memberId === who), [notes, who]);
  // Newest reading day first; each day shows everyone's notes side by side.
  const days = useMemo(() => {
    const byDay = new Map<string, Note[]>();
    for (const n of shown) byDay.set(n.body.day ?? "", [...(byDay.get(n.body.day ?? "") ?? []), n]);
    return [...byDay.entries()].sort(([a], [b]) => (!a ? 1 : !b ? -1 : b.localeCompare(a)));
  }, [shown]);

  async function act(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(words(e, "Couldn't do that."));
    }
  }

  if (notes === null) return <p className="dash-reader-empty">Unlocking your group…</p>;

  const latestDay = notes.map((n) => n.body.day).filter((d): d is string => Boolean(d)).sort().pop() ?? null;

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <button type="button" className="dash-word-link" onClick={() => onBack()}>
            ← All groups
          </button>
          <div className="eyebrow eyebrow-amber mt-3">🔒 Locked - only this group can read it</div>
          <h1 className="dash-title mt-1">{name ?? "Your group"}</h1>
          <div className="dash-subtitle">{people.map((p) => (p.me ? `${p.name} (you)` : p.name)).join(", ")}</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col-12">
          {code ? (
            <InvitePanel link={inviteLink({ code, secret })} first={justStarted || people.length === 1} />
          ) : (
            <p className="dash-starter-error">Couldn&apos;t rebuild this group&apos;s link on this device.</p>
          )}
        </div>

        <div className="dash-col-12">
          <Composer
            secret={secret}
            group={id}
            startDay={latestDay}
            onSaved={load}
          />
        </div>

        <div className="dash-col-12">
          <Panel eyebrow={`${notes.length === 1 ? "1 note" : `${notes.length} notes`}`} title="Compare notes">
            {people.length > 1 && (
              <div className="shared-filter" role="group" aria-label="Whose notes">
                {[{ id: "all", name: "Everyone" }, ...people].map((p) => (
                  <button key={p.id} type="button" className={`shared-chip ${who === p.id ? "is-on" : ""}`} onClick={() => setWho(p.id)}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            {notes.length === 0 && (
              <p className="dash-word-hint">
                Nothing here yet. Write a note above, or tap ❖ Share on any note in your journal. Notes on the same day sit side by side.
              </p>
            )}
            {unreadable > 0 && (
              <p className="dash-starter-error">
                {unreadable === 1 ? "1 note" : `${unreadable} notes`} couldn&apos;t be unlocked with this device&apos;s key.
              </p>
            )}
            {error && <p className="dash-starter-error">{error}</p>}
            {days.map(([day, list]) => {
              const writers = people.filter((p) => list.some((n) => n.memberId === p.id));
              return (
                <section key={day || "none"} className="shared-day">
                  <h3 className="shared-day-title">{dayTitle(day || null)}</h3>
                  <div className="shared-people">
                    {writers.map((p) => (
                      <div key={p.id} className="shared-person">
                        <div className="shared-person-name">{p.me ? `${p.name} (you)` : p.name}</div>
                        {verseOrder(
                          list
                            .filter((n) => n.memberId === p.id)
                            .map((n) => ({ ...n, book: n.body.book, chapter: n.body.chapter, verse: n.body.verse })),
                        ).map((n) => (
                          <GroupNote
                            key={n.id}
                            note={n}
                            mine={p.me}
                            canRemove={p.me || leader}
                            secret={secret}
                            act={act}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </Panel>
        </div>

        <div className="dash-col-12">
          <GroupSettings group={id} secret={secret} name={name ?? ""} people={people} me={me} leader={leader} act={act} onBack={onBack} />
        </div>

        <div className="dash-col-12">
          <PrivacyCard />
        </div>
      </div>
    </>
  );
}

function InvitePanel({ link, first }: { link: string; first: boolean }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  // Copy or the device's own share sheet only: a wa.me link would hand the key
  // to a web server on its way to WhatsApp.
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setShow(true);
    }
  }

  return (
    <Panel eyebrow="Invite your friends" title={first ? "Send them this link" : "Your group's link"} className={first ? "shared-invite" : ""}>
      <p className="dash-word-hint">
        This link is the key to your group. Anyone who has it can join, so send it only to people you trust. Keep it somewhere safe too: if
        everyone lost it, no one could ever open these notes again - not even us.
      </p>
      <div className="flex gap-2 flex-wrap mt-3">
        <button type="button" className="dash-btn dash-btn-primary" onClick={copy}>
          {copied ? "✓ Copied" : "Copy the link"}
        </button>
        {canShare && (
          <button
            type="button"
            className="dash-btn dash-btn-ghost"
            onClick={() => void navigator.share({ title: "Our shared notes", text: "Join our private notes group on The Study:", url: link }).catch(() => {})}
          >
            Share…
          </button>
        )}
        <button type="button" className="dash-btn dash-btn-ghost" onClick={() => setShow((v) => !v)}>
          {show ? "Hide the link" : "Show the link"}
        </button>
      </div>
      {show && <input className="dash-input shared-paste mt-3" readOnly value={link} aria-label="Your group's link" onFocus={(e) => e.target.select()} />}
    </Panel>
  );
}

function Composer({ secret, group, startDay, onSaved }: { secret: string; group: string; startDay: string | null; onSaved: () => Promise<void> | void }) {
  const [day, setDay] = useState(startDay && inPlan(startDay) ? String(planDay(startDay).n) : "");
  const [passage, setPassage] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (busy) return;
    if (!text.trim()) return setError("Write your note first.");
    const n = day.trim() ? Number(day) : null;
    if (n !== null && (!Number.isInteger(n) || n < 1 || n > 365)) return setError("The day is a number from 1 to 365.");
    const p = passage.trim() ? parsePassage(passage) : null;
    if (passage.trim() && !p) return setError("Type the passage like John 4 or John 4:7.");
    setBusy(true);
    setError(null);
    try {
      const body: SharedNoteBody = {
        text: text.trim().slice(0, MAX_NOTE),
        day: n ? planPage(n) : null,
        book: p?.book ?? null,
        chapter: p?.chapter ?? null,
        verse: p?.verse ?? null,
        verseEnd: p?.verseEnd ?? null,
      };
      await groupsCall("POST", { action: "note", group, sealed: await seal(secret, body) });
      setText("");
      setPassage("");
      await onSaved();
    } catch (e) {
      setError(words(e, "Couldn't share that."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel eyebrow="Write to the group" title="Add a note">
      <div className="shared-fields">
        <div>
          <label className="dash-label" htmlFor="shared-day">
            Day (optional)
          </label>
          <input id="shared-day" className="dash-input" inputMode="numeric" placeholder="e.g. 34" value={day} onChange={(e) => setDay(e.target.value)} />
        </div>
        <div>
          <label className="dash-label" htmlFor="shared-passage">
            Passage (optional)
          </label>
          <input id="shared-passage" className="dash-input" placeholder="e.g. John 4:7" value={passage} onChange={(e) => setPassage(e.target.value)} />
        </div>
      </div>
      <GrowingTextarea
        className="dash-textarea mt-3"
        minRows={3}
        maxLength={MAX_NOTE}
        placeholder="What stood out to you?"
        aria-label="Your note"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
      />
      <button type="button" className="dash-btn dash-btn-primary mt-3" onClick={send} disabled={busy}>
        {busy ? "Locking and sharing…" : "Share with the group"}
      </button>
      <p className="dash-word-hint mt-2">You can also tap ❖ Share on any note in your journal.</p>
      {error && <p className="dash-starter-error">{error}</p>}
    </Panel>
  );
}

function GroupNote({
  note,
  mine,
  canRemove,
  secret,
  act,
}: {
  note: Note;
  mine: boolean;
  canRemove: boolean;
  secret: string;
  act: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const passage = formatPassage(passageOf(note.body));
  return (
    <article className="shared-note">
      {passage && <div className="shared-note-ref">{passage}</div>}
      {editing !== null ? (
        <>
          <GrowingTextarea className="dash-textarea" minRows={3} maxLength={MAX_NOTE} value={editing} aria-label="Edit your note" onChange={(e) => setEditing(e.target.value)} />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              className="dash-btn dash-btn-primary dash-note-nav"
              disabled={!editing.trim()}
              onClick={() =>
                void act(async () => {
                  await groupsCall("PATCH", { note: note.id, sealed: await seal(secret, { ...note.body, text: editing.trim() }) });
                  setEditing(null);
                })
              }
            >
              Save
            </button>
            <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <NoteText text={note.body.text} />
      )}
      {editing === null && (mine || canRemove) && (
        <div className="shared-note-actions">
          {mine && (
            <button type="button" className="dash-word-link" onClick={() => setEditing(note.body.text)}>
              Edit
            </button>
          )}
          {canRemove && (
            <button
              type="button"
              className="dash-word-link is-danger"
              onClick={() => {
                if (!confirm(mine ? "Take this note out of the group?" : "Take this person's note out of the group?")) return;
                void act(() => groupsCall("DELETE", undefined, `?note=${encodeURIComponent(note.id)}`));
              }}
            >
              Remove
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function NameBox({ label, value, onSave }: { label: string; value: string; onSave: (name: string) => Promise<void> }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const changed = text.trim() && text.trim() !== value;
  return (
    <div>
      <label className="dash-label">
        {label}
        <input className="dash-input mt-1" value={text} maxLength={80} onChange={(e) => setText(e.target.value)} />
      </label>
      {changed && (
        <button type="button" className="dash-btn dash-btn-ghost dash-note-nav mt-2" onClick={() => void onSave(text.trim())}>
          Save
        </button>
      )}
    </div>
  );
}

function GroupSettings({
  group,
  secret,
  name,
  people,
  me,
  leader,
  act,
  onBack,
}: {
  group: string;
  secret: string;
  name: string;
  people: Person[];
  me: Person | undefined;
  leader: boolean;
  act: (fn: () => Promise<unknown>) => Promise<void>;
  onBack: (message?: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  // These end the group for this person, so there's nothing to reload.
  async function final(body: object, message: string) {
    setError(null);
    try {
      await groupsCall("POST", body);
      onBack(message);
    } catch (e) {
      setError(words(e, "Couldn't do that."));
    }
  }

  return (
    <Panel eyebrow="This group" title="People and settings">
      <ul className="shared-roster">
        {people.map((p) => (
          <li key={p.id}>
            <span>
              {p.name}
              {p.me ? " (you)" : ""}
              {p.leader ? " · leader" : ""}
            </span>
            {leader && !p.me && (
              <button
                type="button"
                className="dash-word-link is-danger"
                onClick={() => {
                  if (!confirm(`Take ${p.name} out of the group? Their notes come out too, and they can't come back in.`)) return;
                  void act(() => groupsCall("POST", { action: "remove", group, member: p.id }));
                }}
              >
                Take out
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="dash-word-hint mt-2">The leader is whoever has been in the group longest.</p>

      <div className="shared-fields mt-4">
        {me && (
          <NameBox
            label="Your name in this group"
            value={me.name}
            onSave={(n) => act(async () => groupsCall("PATCH", { group, myName: await seal(secret, { name: n }) }))}
          />
        )}
        {leader && (
          <NameBox
            label="Group name"
            value={name}
            onSave={(n) => act(async () => groupsCall("PATCH", { group, sealedName: await seal(secret, { name: n }) }))}
          />
        )}
      </div>

      <div className="flex gap-2 flex-wrap mt-5">
        {leader && (
          <button
            type="button"
            className="dash-btn dash-btn-ghost"
            onClick={() => {
              if (!confirm("Make a new link? The old one stops working, so nobody new can join with it. People already in the group stay in.")) return;
              void act(async () => {
                const code = newJoinCode();
                await groupsCall("POST", { action: "new-link", group, link: code, sealedLink: await seal(secret, { code }) });
              });
            }}
          >
            Make a new link
          </button>
        )}
        <button
          type="button"
          className="dash-btn dash-btn-ghost"
          onClick={() => {
            if (!confirm("Leave this group? Your notes come out of it. You could come back with the link, but those notes wouldn't return.")) return;
            void final({ action: "leave", group }, "You've left the group.");
          }}
        >
          Leave this group
        </button>
        {leader && (
          <button
            type="button"
            className="dash-btn dash-btn-ghost"
            onClick={() => {
              if (!confirm("Close this group for everyone? Nobody will be able to open its notes again. This can't be undone.")) return;
              void final({ action: "close", group }, "The group is closed.");
            }}
          >
            Close the group
          </button>
        )}
      </div>
      {error && <p className="dash-starter-error">{error}</p>}
    </Panel>
  );
}
