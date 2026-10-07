"use client";

// The owner's session video on a journal day: always there on each date -
// paste the YouTube link and it plays right in the day (and for members on
// the same day); change or remove it any time. One call usually covers
// several days: "up to Day N" puts the same video on each of them, and
// members' bells (and phones) say a new video is up.

import { useState } from "react";
import { parseYouTube } from "@/lib/study/youtube";
import { DayVideo } from "./day-video";

export function SessionVideo({
  url,
  dayN,
  onSave,
}: {
  url: string | null | undefined;
  dayN: number;
  onSave: (url: string, toDay?: number) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [upTo, setUpTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: string) {
    if (next && !parseYouTube(next)) return setError("That isn't a YouTube link - copy it from YouTube's Share button.");
    const to = upTo.trim() ? Number(upTo) : undefined;
    if (to !== undefined && (!Number.isInteger(to) || to < dayN || to > Math.min(365, dayN + 30))) {
      return setError(`"Up to Day" should be between Day ${dayN} and Day ${Math.min(365, dayN + 30)} - or leave it empty for just this day.`);
    }
    setBusy(true);
    setError(null);
    const ok = await onSave(next, to && to > dayN ? to : undefined);
    setBusy(false);
    if (ok) {
      setEditing(false);
      setText("");
      setUpTo("");
    }
  }

  if (url && !editing) {
    return (
      <div className="session-video">
        <DayVideo url={url} />
        <div className="session-video-tools">
          <button
            type="button"
            className="dash-word-link"
            onClick={() => {
              setText(url);
              setEditing(true);
            }}
          >
            Change the link
          </button>
          <button
            type="button"
            className="dash-word-link"
            onClick={() => {
              if (confirm("Take the video off this day? You can add it again any time.")) void save("");
            }}
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="session-video is-empty">
      <span className="session-video-label">▶ YouTube video for this day</span>
      <input
        className="dash-input"
        inputMode="url"
        placeholder="Paste the YouTube link here"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void save(text.trim());
          }
        }}
        aria-label="YouTube link for this day's session"
      />
      <label className="session-video-upto">
        <span>This call covered up to Day</span>
        <input
          className="dash-input"
          inputMode="numeric"
          placeholder={String(dayN)}
          value={upTo}
          onChange={(e) => {
            setUpTo(e.target.value.replace(/[^0-9]/g, "").slice(0, 3));
            if (error) setError(null);
          }}
          aria-label="The last day this call covered"
        />
      </label>
      <button type="button" className="dash-btn dash-btn-primary dash-note-nav" disabled={busy || !text.trim()} onClick={() => void save(text.trim())}>
        {busy ? "Saving…" : "Add"}
      </button>
      {editing && (
        <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => setEditing(false)}>
          Cancel
        </button>
      )}
      {error ? (
        <p className="dash-starter-error session-video-error">{error}</p>
      ) : (
        <p className="session-video-hint">
          Members see the video on this day (and every day up to the one you put) in their journal, and their bell tells them it&apos;s up.
        </p>
      )}
    </div>
  );
}
