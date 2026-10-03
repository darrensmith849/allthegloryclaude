"use client";

import { useEffect, useState } from "react";
import { useMe } from "@/components/study/shell";

const MIN_PASSWORD = 8;

export default function StudyJoinPage() {
  const me = useMe();
  const [invite, setInvite] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInvite(new URLSearchParams(window.location.search).get("invite") ?? "");
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password.length < MIN_PASSWORD) {
      setError(`Use a password of at least ${MIN_PASSWORD} characters.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/study/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password, invite }),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(data.error ?? "Couldn't make your account.");
      window.location.assign("/study/journal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't make your account.");
      setBusy(false);
    }
  }

  const closed = me.loaded && (me.study?.signup === "closed" || (me.study?.signup === "invite" && !invite));

  return (
    <div className="dash-login">
      <form className="dash-login-card" onSubmit={submit}>
        <div className="eyebrow eyebrow-amber">All The Glory · The Study</div>
        <h1 className="dash-title mt-1">{invite ? "You're invited" : "Join The Study"}</h1>
        <p className="dash-subtitle">
          Keep your own notes as you read through the Bible in the order it happened - by day, on a calendar, with
          the Hebrew and Greek behind the words.
        </p>
        {closed ? (
          <p className="dash-word-note mt-6">
            {me.study?.signup === "closed"
              ? "Joining is closed for now."
              : "Joining is by invite for now - use the link you were sent."}
          </p>
        ) : (
          <>
            <label className="dash-label mt-6" htmlFor="sj-name">
              Your name
            </label>
            <input
              id="sj-name"
              autoComplete="name"
              className="dash-input dash-word-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <label className="dash-label mt-4" htmlFor="sj-email">
              Email
            </label>
            <input
              id="sj-email"
              type="email"
              autoComplete="email"
              className="dash-input dash-word-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label className="dash-label mt-4" htmlFor="sj-password">
              Password
            </label>
            <input
              id="sj-password"
              type="password"
              autoComplete="new-password"
              className="dash-input dash-word-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="dash-word-hint">At least {MIN_PASSWORD} characters.</p>
            {error && (
              <div className="mt-3 text-[13px] text-[#f1a07d]" role="alert">
                {error}
              </div>
            )}
            <button type="submit" className="dash-btn dash-btn-primary dash-word-fill-btn mt-5" disabled={busy}>
              {busy ? "Making your journal…" : "Make my account"}
            </button>
            <p className="dash-word-hint mt-4">
              Your journal is private to you. We keep only your name, email and what you write, and you can download
              or delete all of it from your Account page. See our <a className="dash-word-link" href="/privacy">privacy policy</a>.
            </p>
          </>
        )}
        <p className="dash-word-hint mt-3">
          Already have an account? <a className="dash-word-link" href="/study/login">Log in</a>
        </p>
      </form>
    </div>
  );
}
