"use client";

// Settings: your sister's own dashboard - set it up with her name and a
// password, change the password, or turn her login off (nothing is deleted).
// She logs in at /dashboard ("Family") and sees only her own things.

import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { PasswordInput } from "@/components/ui/password-input";

const MIN_PASSWORD = 10;
const LINK = "https://alltheglory.co.za/dashboard/login?family=1"; // opens straight on her (Family) login
type Family = { id: string; name: string; createdAt: number; lastSeen: number | null; disabled: boolean } | null;

const when = (ms: number | null) =>
  ms ? new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "not yet";

export function FamilyAccess() {
  const [member, setMember] = useState<Family | undefined>(undefined);
  const [form, setForm] = useState<{ name: string; password: string; confirm: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/admin/family", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { member: null }))
      .then((d: { member: Family }) => setMember(d.member))
      .catch(() => setMember(null));
  }, []);

  async function send(body: object, done: string) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/family", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const d = (await r.json().catch(() => ({}))) as { member?: Family; error?: string };
      if (!r.ok) return setMsg({ ok: false, text: d.error ?? "Couldn't save that. Try again." });
      setMember(d.member ?? null);
      setForm(null);
      setMsg({ ok: true, text: done });
    } catch {
      setMsg({ ok: false, text: "Couldn't reach the server. Try again." });
    } finally {
      setBusy(false);
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!member && !form.name.trim()) return setMsg({ ok: false, text: "Put in her name." });
    if (!member || form.password) {
      if (form.password.length < MIN_PASSWORD) return setMsg({ ok: false, text: `Use at least ${MIN_PASSWORD} characters for her password.` });
      if (form.password !== form.confirm) return setMsg({ ok: false, text: "The two passwords don't match." });
    }
    void send(
      { name: form.name, password: form.password },
      member ? (form.password ? "Saved - her new password works now (her other devices log in again)." : "Saved.") : "Her dashboard is ready - give her the password.",
    );
  }

  return (
    <Panel eyebrow="Family" title="Your sister's dashboard">
      <div className="family-access">
        <p className="dash-word-hint">
          Her own private dashboard: her own Study Notes and Word Journal (with your study to read alongside), Names of God,
          her own Money (in rand) and a To do list. She logs in at alltheglory.co.za/dashboard - tapping{" "}
          <strong>Family</strong> - with the password you set here. She never sees your things, and her money and list
          are hers alone.
        </p>
        {member && (
          <div className="family-access-status">
            <span>
              Her link: <strong>{LINK.replace("https://", "")}</strong>
            </span>
            <button
              type="button"
              className="dash-btn dash-btn-ghost dash-note-nav"
              onClick={() =>
                navigator.clipboard
                  ?.writeText(LINK)
                  .then(() => setCopied(true))
                  .catch(() => {})
              }
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>
        )}
        {member && (
          <p className="dash-word-hint">
            To see her side yourself, open her link in a private window - on this browser you&apos;re logged in as you, and
            logging in there as her logs you out.
          </p>
        )}
        {member === undefined ? (
          <p className="dash-word-hint">Loading…</p>
        ) : member ? (
          <div className="family-access-status">
            <span>
              Set up for <strong>{member.name}</strong> · since {when(member.createdAt)} · last here {when(member.lastSeen)}
            </span>
            {member.disabled && <span className="family-access-off">Turned off - she can&apos;t log in</span>}
          </div>
        ) : null}

        {form ? (
          <form className="family-access-form" onSubmit={save}>
            <input type="text" name="username" autoComplete="username" value="family" readOnly hidden />
            <div>
              <label className="dash-label" htmlFor="family-name">
                Her name
              </label>
              <input id="family-name" className="dash-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sarah" />
            </div>
            <div>
              <label className="dash-label" htmlFor="family-pw">
                {member ? "New password (leave empty to keep hers)" : "Her password"}
              </label>
              <PasswordInput id="family-pw" autoComplete="new-password" className="dash-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="dash-label" htmlFor="family-pw2">
                Password again
              </label>
              <PasswordInput id="family-pw2" autoComplete="new-password" className="dash-input" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
            </div>
            <p className="dash-word-hint">At least {MIN_PASSWORD} characters. Not the same as yours.</p>
            <div className="flex items-center gap-3 flex-wrap">
              <button type="submit" className="dash-btn dash-btn-primary" disabled={busy}>
                {busy ? "Saving…" : member ? "Save" : "Set up her dashboard"}
              </button>
              <button type="button" className="dash-word-link" onClick={() => setForm(null)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          member !== undefined && (
            <div className="flex items-center gap-2 flex-wrap">
              <button type="button" className="dash-btn dash-btn-primary" onClick={() => (setMsg(null), setForm({ name: member?.name ?? "", password: "", confirm: "" }))}>
                {member ? "Change her name or password" : "Set up her dashboard"}
              </button>
              {member && (
                <button
                  type="button"
                  className="dash-btn dash-btn-ghost"
                  disabled={busy}
                  onClick={() => {
                    if (!member.disabled && !confirm(`Turn off ${member.name}'s login? Everything of hers is kept - you can turn it on again.`)) return;
                    void send({ disabled: !member.disabled }, member.disabled ? "Turned on again - she can log in." : "Turned off - everything of hers is kept.");
                  }}
                >
                  {member.disabled ? "Turn her login on again" : "Turn her login off"}
                </button>
              )}
            </div>
          )
        )}
        {msg && <p className={`text-[12.5px] ${msg.ok ? "text-[var(--colour-amber-soft)]" : "text-[#f1a07d]"}`}>{msg.text}</p>}
      </div>
    </Panel>
  );
}
