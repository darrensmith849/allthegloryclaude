"use client";

// "Share" on a journal note: sends a copy, locked on this device, to one of the
// member's Shared notes groups. The journal note itself stays as it is.

import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import type { StudyNote } from "@/lib/dashboard/notes";
import { groupsCall, loadSecrets, markShared, seal, sharedTo, unseal, type GroupRow, type SharedNoteBody } from "@/lib/study/shared-groups";

export function ShareNote({ note, memberId }: { note: StudyNote; memberId: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<{ id: string; name: string }[] | null>(null);
  const [lockedAway, setLockedAway] = useState(false); // in groups, but none open on this device
  const [sent, setSent] = useState<string[]>(() => (typeof window === "undefined" ? [] : (sharedTo(memberId)[note.id] ?? [])));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const page = pathname?.startsWith("/dashboard") ? "/dashboard/shared" : "/study/shared";

  async function toggle() {
    if (open) return setOpen(false);
    setOpen(true);
    setError(null);
    try {
      const keys = loadSecrets(memberId);
      const { groups: rows } = await groupsCall<{ groups: GroupRow[] }>("GET");
      const named = await Promise.all(
        rows.map(async (g) => {
          if (!keys[g.id]) return null;
          const name = await unseal<{ name: string }>(keys[g.id], g.sealedName).catch(() => null);
          return name ? { id: g.id, name: name.name } : null;
        }),
      );
      const usable = named.filter((g): g is { id: string; name: string } => Boolean(g));
      setLockedAway(rows.length > 0 && usable.length === 0);
      setGroups(usable);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open your groups.");
      setGroups([]);
    }
  }

  async function shareTo(group: string) {
    if (busy) return;
    setBusy(group);
    setError(null);
    try {
      const body: SharedNoteBody = {
        text: note.text,
        day: note.day,
        book: note.book,
        chapter: note.chapter,
        verse: note.verse,
        verseEnd: note.verseEnd,
        from: note.id,
      };
      await groupsCall("POST", { action: "note", group, sealed: await seal(loadSecrets(memberId)[group], body) });
      markShared(memberId, note.id, group);
      setSent((s) => [...new Set([...s, group])]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't share that.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <span className="shared-share">
      <button type="button" className={`dash-word-link ${sent.length ? "is-starred" : ""}`} onClick={toggle} aria-expanded={open} title="Share a copy with one of your groups">
        {sent.length ? "❖ Shared" : "❖ Share"}
      </button>
      {open && (
        <span className="shared-pop">
          {groups === null && <span className="shared-pop-hint">Opening your groups…</span>}
          {groups?.map((g) => (
            <button key={g.id} type="button" className="shared-pop-group" onClick={() => shareTo(g.id)} disabled={busy !== null}>
              <span>{g.name}</span>
              <span className="shared-pop-state">{busy === g.id ? "Sharing…" : sent.includes(g.id) ? "✓ Shared - again?" : "Share"}</span>
            </button>
          ))}
          {groups?.length === 0 && !lockedAway && !error && (
            <span className="shared-pop-hint">
              You&apos;re not in a group yet. <Link href={page}>Start one, or join with a link</Link>.
            </span>
          )}
          {lockedAway && (
            <span className="shared-pop-hint">
              Your groups are locked on this device. <Link href={page}>Open your group&apos;s link</Link> here to unlock them.
            </span>
          )}
          {Boolean(groups?.length) && <span className="shared-pop-hint">Your group gets a locked copy. Changing this note later won&apos;t change the copy.</span>}
          {error && <span className="dash-starter-error">{error}</span>}
          <button type="button" className="dash-word-link" onClick={() => setOpen(false)}>
            Close
          </button>
        </span>
      )}
    </span>
  );
}
