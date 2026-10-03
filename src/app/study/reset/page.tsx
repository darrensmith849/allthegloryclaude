"use client";

import { useEffect, useState } from "react";

const MIN_PASSWORD = 8;

export default function StudyResetPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
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
      const r = await fetch("/api/study/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(data.error ?? "Couldn't set your password.");
      window.location.assign("/study/journal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't set your password.");
      setBusy(false);
    }
  }

  return (
    <div className="dash-login">
      <form className="dash-login-card" onSubmit={submit}>
        <div className="eyebrow eyebrow-amber">All The Glory · The Study</div>
        <h1 className="dash-title mt-1">New password</h1>
        <p className="dash-subtitle">Choose a new password for your study journal.</p>
        <label className="dash-label mt-6" htmlFor="sr-password">
          New password
        </label>
        <input
          id="sr-password"
          type="password"
          autoComplete="new-password"
          className="dash-input dash-word-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <p className="dash-word-hint">At least {MIN_PASSWORD} characters. You&apos;ll be logged out everywhere else.</p>
        {error && (
          <div className="mt-3 text-[13px] text-[#f1a07d]" role="alert">
            {error}
          </div>
        )}
        <button type="submit" className="dash-btn dash-btn-primary dash-word-fill-btn mt-5" disabled={busy || !token}>
          {busy ? "Saving…" : "Save and open my journal"}
        </button>
        {!token && <p className="dash-word-hint mt-3">This page needs the full link you were sent.</p>}
      </form>
    </div>
  );
}
