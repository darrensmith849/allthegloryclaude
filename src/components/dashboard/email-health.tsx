"use client";

// "Is email working?" on the owner's Members page: when the site last sent
// an email (welcome, password reset, a note to you) and whether it went,
// plus a button to send yourself a test now.

import { useEffect, useState } from "react";

interface Last {
  at: number;
  what: string;
  ok: boolean;
  status: number;
  detail?: string;
}

const ago = (ms: number) => {
  const m = Math.round((Date.now() - ms) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} hour${h === 1 ? "" : "s"} ago`;
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export function EmailHealth() {
  const [last, setLast] = useState<Last | null | undefined>(undefined);
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const load = () =>
    fetch("/api/members/email-test", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { last?: Last | null; to?: string } | null) => {
        setLast(d?.last ?? null);
        setTo(d?.to ?? "");
      })
      .catch(() => setLast(null));
  useEffect(() => {
    void load();
  }, []);

  async function test() {
    setBusy(true);
    setResult(null);
    const r = await fetch("/api/members/email-test", { method: "POST" }).catch(() => null);
    const d = r ? ((await r.json().catch(() => ({}))) as { ok?: boolean; status?: number; detail?: string }) : null;
    setResult(
      d?.ok
        ? `✓ Sent - check ${to || "your inbox"} (and Junk, the first time).`
        : `✗ It didn't send${d?.status ? ` (Brevo said ${d.status})` : ""}${d?.detail ? `: ${d.detail.slice(0, 140)}` : ""}.`,
    );
    setBusy(false);
    void load();
  }

  return (
    <div className="dash-email-health">
      <div className="min-w-0">
        <div className="dash-email-health-title">Is email working?</div>
        <div className="dash-word-hint">
          {last === undefined
            ? "Checking…"
            : last === null
              ? "No emails sent yet."
              : `${last.ok ? "✓" : "✗"} Last email: ${last.what} · ${ago(last.at)}${last.ok ? "" : ` - didn't send (${last.status || "no connection"})`}`}
        </div>
        {result && <div className="dash-email-health-result">{result}</div>}
      </div>
      <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={test} disabled={busy}>
        {busy ? "Sending…" : "Send me a test email"}
      </button>
    </div>
  );
}
