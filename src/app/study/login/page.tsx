"use client";

import { useEffect, useState } from "react";
import { forgetMe, useMe } from "@/components/study/shell";

// Only same-site paths inside /study are followed after logging in.
function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/study") && !raw.startsWith("//") ? raw : "/study/journal";
}

export default function StudyLoginPage() {
  const me = useMe();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Logging in happens on The Study's page on the main site.
  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.replace(`/the-study?login=1${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/study/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(data.error ?? "Couldn't log in.");
      forgetMe();
      window.location.assign(safeNext(new URLSearchParams(window.location.search).get("next")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't log in.");
      setBusy(false);
    }
  }

  return (
    <div className="dash-login">
      <form className="dash-login-card" onSubmit={submit}>
        <div className="eyebrow eyebrow-amber">All The Glory · The Study</div>
        <h1 className="dash-title mt-1">Log in</h1>
        <p className="dash-subtitle">Open your Bible study journal.</p>
        <label className="dash-label mt-6" htmlFor="st-email">
          Email
        </label>
        <input
          id="st-email"
          type="email"
          autoComplete="email"
          className="dash-input dash-word-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="dash-label mt-4" htmlFor="st-password">
          Password
        </label>
        <input
          id="st-password"
          type="password"
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
        <button type="submit" className="dash-btn dash-btn-primary dash-word-fill-btn mt-5" disabled={busy}>
          {busy ? "Opening…" : "Log in"}
        </button>
        <p className="dash-word-hint mt-4">
          Forgot your password? Ask whoever invited you for a reset link.
          {me.study?.signup === "open" && (
            <>
              {" "}
              New here? <a className="dash-word-link" href="/study/join">Make an account</a>.
            </>
          )}
        </p>
        <a href="/study" className="dash-login-back">
          ← The Study
        </a>
      </form>
    </div>
  );
}
