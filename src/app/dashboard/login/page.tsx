"use client";

import { useEffect, useRef, useState } from "react";

const MIN_PASSWORD = 10;

// Only send people back to somewhere inside the dashboard.
function safeNext(next: string | null): string {
  return next && /^\/dashboard(?:[/?#]|$)/.test(next) && !next.startsWith("/dashboard/login")
    ? next
    : "/dashboard";
}

type Mode = "loading" | "setup" | "login";

export default function AdminLoginPage() {
  const [mode, setMode] = useState<Mode>("loading");
  // Daniel's team log in here with their Study email and password - so the
  // dashboard's Home Screen app (scope /dashboard) works for them too.
  const [team, setTeam] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const goIn = () =>
    // A full page load, so the new session cookie goes with it.
    window.location.assign(safeNext(new URLSearchParams(window.location.search).get("next")));

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("team")) setTeam(true);
    fetch("/api/admin/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: { configured?: boolean; signedIn?: boolean; role?: string | null }) => {
        if (s.signedIn) goIn();
        else if (s.role === "team") window.location.assign("/dashboard/community");
        else setMode(s.configured ? "login" : "setup");
      })
      .catch(() => {
        setMode("login");
        setError("Couldn't reach the server. Check your connection and refresh.");
      });
  }, []);

  useEffect(() => {
    if (mode !== "loading") input.current?.focus();
  }, [mode, team]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    if (team) {
      if (!email.includes("@")) return setError("Use the email address of your Study account.");
      setBusy(true);
      setError(null);
      try {
        const r = await fetch("/api/study/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (r.ok) {
          // Only the team get into the dashboard; members go to their Study.
          const s = (await fetch("/api/admin/status", { cache: "no-store" }).then((x) => x.json()).catch(() => ({}))) as {
            role?: string | null;
          };
          return window.location.assign(s.role === "team" ? "/dashboard/community" : "/study");
        }
        const data = (await r.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Couldn't log in. Try again.");
        setPassword("");
      } catch {
        setError("Couldn't reach the server. Check your connection and try again.");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (mode === "setup") {
      if (password.length < MIN_PASSWORD) return setError(`Use at least ${MIN_PASSWORD} characters.`);
      if (password !== confirm) return setError("The two passwords don't match.");
    }
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(mode === "setup" ? "/api/admin/setup" : "/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (r.ok) return goIn();
      const data = (await r.json().catch(() => ({}))) as { error?: string; setup?: boolean };
      if (r.status === 409) setMode(data.setup ? "setup" : "login");
      setError(data.error ?? "Couldn't log in. Try again.");
      setPassword("");
      setConfirm("");
      input.current?.focus();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const setup = mode === "setup";

  return (
    <div className="dash-login">
      <form className="dash-login-card" onSubmit={submit}>
        <div className="eyebrow eyebrow-amber">All The Glory</div>
        <h1 className="dash-title mt-1">{team ? "Team login" : setup ? "Create your password" : "Admin login"}</h1>
        <p className="dash-subtitle">
          {mode === "loading"
            ? "One moment…"
            : team
              ? "For Daniel's team - log in with your Study email and password."
              : setup
                ? "Choose the password that will protect your private dashboard. You'll use it to log in on any device."
                : "Your private dashboard."}
        </p>

        {mode !== "loading" && team && (
          <>
            <label className="dash-label mt-6" htmlFor="team-email">
              Email
            </label>
            <input
              id="team-email"
              ref={input}
              type="email"
              name="email"
              autoComplete="username"
              inputMode="email"
              className="dash-input dash-word-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label className="dash-label mt-4" htmlFor="team-password">
              Password
            </label>
            <input
              id="team-password"
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
            <button type="submit" className="dash-btn dash-btn-primary dash-word-fill-btn mt-5" disabled={busy || !email || !password}>
              {busy ? "Logging in…" : "Log in"}
            </button>
            <a href="/the-study?login=1" className="dash-login-team">
              Forgotten your password? Reset it on The Study →
            </a>
            <button
              type="button"
              className="dash-login-team dash-login-switch"
              onClick={() => {
                setTeam(false);
                setError(null);
                setPassword("");
              }}
            >
              ← Daniel&apos;s login
            </button>
          </>
        )}

        {mode !== "loading" && !team && (
          <>
            {/* Lets password managers save and fill this login. */}
            <input type="text" name="username" autoComplete="username" value="admin" readOnly hidden />

            <label className="dash-label mt-6" htmlFor="admin-password">
              {setup ? "New password" : "Password"}
            </label>
            <input
              id="admin-password"
              ref={input}
              type="password"
              name="password"
              autoComplete={setup ? "new-password" : "current-password"}
              className="dash-input dash-word-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {setup && (
              <>
                <label className="dash-label mt-4" htmlFor="admin-confirm">
                  Type it again
                </label>
                <input
                  id="admin-confirm"
                  type="password"
                  name="confirm"
                  autoComplete="new-password"
                  className="dash-input dash-word-input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
                <p className="dash-word-hint">At least {MIN_PASSWORD} characters. Save it in your password manager.</p>
              </>
            )}
            {error && (
              <div className="mt-3 text-[13px] text-[#f1a07d]" role="alert">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="dash-btn dash-btn-primary dash-word-fill-btn mt-5"
              disabled={busy || !password || (setup && !confirm)}
            >
              {busy ? (setup ? "Saving…" : "Logging in…") : setup ? "Create password & log in" : "Log in"}
            </button>
          </>
        )}
        {mode === "login" && !team && (
          <button
            type="button"
            className="dash-login-team dash-login-switch"
            onClick={() => {
              setTeam(true);
              setError(null);
              setPassword("");
            }}
          >
            Not Daniel? Team members log in here →
          </button>
        )}
        <a href="/" className="dash-login-back">
          ← Back to the public site
        </a>
      </form>
    </div>
  );
}
