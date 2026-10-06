"use client";

// The owner's session video on a journal day: always there on each date -
// paste the YouTube link and it plays right in the day (and for members on
// the same day); change or remove it any time.

import { useState } from "react";
import { parseYouTube } from "@/lib/study/youtube";
import { DayVideo } from "./day-video";

export function SessionVideo({ url, onSave }: { url: string | null | undefined; onSave: (url: string) => Promise<boolean> }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: string) {
    if (next && !parseYouTube(next)) return setError("That isn't a YouTube link - copy it from YouTube's Share button.");
    setBusy(true);
    setError(null);
    const ok = await onSave(next);
    setBusy(false);
    if (ok) {
      setEditing(false);
      setText("");
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
        <p className="session-video-hint">Members see the video on this day in their journal.</p>
      )}
    </div>
  );
}
