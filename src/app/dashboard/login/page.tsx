"use client";

import { useEffect, useRef, useState } from "react";
import { safeNext } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (r.ok) {
        // A full page load, so the new session cookie goes with it.
        window.location.assign(safeNext(new URLSearchParams(window.location.search).get("next")));
        return;
      }
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Couldn't log in. Try again.");
      setPassword("");
      input.current?.focus();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dash-login">
      <form className="dash-login-card" onSubmit={submit}>
        <div className="eyebrow eyebrow-amber">All The Glory</div>
        <h1 className="dash-title mt-1">Admin login</h1>
        <p className="dash-subtitle">Your private dashboard.</p>

        {/* Lets password managers save and fill this login. */}
        <input type="text" name="username" autoComplete="username" value="admin" readOnly hidden />

        <label className="dash-label mt-6" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          ref={input}
          type="password"
          name="password"
          autoComplete="current-password"
          className="dash-input dash-word-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <div className="mt-3 text-[13px] text-[#f1a07d]" role="alert">
            {error}
          </div>
        )}
        <button type="submit" className="dash-btn dash-btn-primary dash-word-fill-btn mt-5" disabled={busy || !password}>
          {busy ? "Logging in…" : "Log in"}
        </button>
        <a href="/" className="dash-login-back">
          ← Back to the public site
        </a>
      </form>
    </div>
  );
}
