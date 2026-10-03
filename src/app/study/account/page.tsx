"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { MemberOnly, useMe } from "@/components/study/shell";

const MIN_PASSWORD = 8;

async function call(method: string, body: unknown): Promise<void> {
  const r = await fetch("/api/study/me", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new Error(data.error ?? "Couldn't save that.");
}

function Account() {
  const me = useMe();
  const [name, setName] = useState(me.member?.name ?? "");
  const [nameSaved, setNameSaved] = useState(false);
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [delPassword, setDelPassword] = useState("");
  const [delConfirm, setDelConfirm] = useState("");
  const [delError, setDelError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [updates, setUpdates] = useState<boolean | null>(null);
  const subscribed = updates ?? Boolean(me.member?.emailUpdates);

  async function setEmailUpdates(on: boolean) {
    try {
      await call("PATCH", { emailUpdates: on });
      setUpdates(on);
      void me.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't save that.");
    }
  }

  useEffect(() => setName(me.member?.name ?? ""), [me.member?.name]);

  async function saveName() {
    try {
      await call("PATCH", { name });
      await me.refresh();
      setNameSaved(true);
      window.setTimeout(() => setNameSaved(false), 2500);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't save that.");
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) {
      setPwMsg({ ok: false, text: `Use at least ${MIN_PASSWORD} characters.` });
      return;
    }
    try {
      await call("PATCH", { current, password });
      setCurrent("");
      setPassword("");
      setPwMsg({ ok: true, text: "✓ Password changed. Other devices have been logged out." });
    } catch (err) {
      setPwMsg({ ok: false, text: err instanceof Error ? err.message : "Couldn't change it." });
    }
  }

  // Everything in the member's journal, as one JSON file.
  async function download() {
    setDownloading(true);
    try {
      const [notes, words, days] = await Promise.all(
        ["/api/study/notes", "/api/study/words", "/api/study/days"].map((u) =>
          fetch(u, { cache: "no-store" }).then((r) => r.json()),
        ),
      );
      const blob = new Blob(
        [
          JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              account: { name: me.member?.name, email: me.member?.email },
              notes: notes.notes ?? [],
              words: words.words ?? [],
              days: days.days ?? [],
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-study-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Couldn't download your journal - check your connection.");
    } finally {
      setDownloading(false);
    }
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("Delete your account and everything in your journal? This can't be undone.")) return;
    try {
      await call("DELETE", { password: delPassword, confirm: delConfirm });
      window.location.assign("/study");
    } catch (err) {
      setDelError(err instanceof Error ? err.message : "Couldn't delete it.");
    }
  }

  async function logout() {
    await fetch("/api/study/logout", { method: "POST" }).catch(() => {});
    window.location.assign("/study");
  }

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">The Study</div>
          <h1 className="dash-title mt-1">Account</h1>
          <div className="dash-subtitle">{me.member?.email}</div>
        </div>
        <button type="button" className="dash-btn dash-btn-ghost" onClick={logout}>
          Log out
        </button>
      </div>

      <div className="dash-grid">
        <div className="dash-col-6">
          <Panel eyebrow="You" title="Your name">
            <input className="dash-input" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                className="dash-btn dash-btn-primary"
                onClick={saveName}
                disabled={!name.trim() || name === me.member?.name}
              >
                Save
              </button>
              {nameSaved && <span className="dash-word-hint">Saved ✓</span>}
            </div>
          </Panel>

          <div className="mt-[18px]">
            <Panel eyebrow="Security" title="Change password">
              <form onSubmit={changePassword} className="flex flex-col gap-2">
                <input
                  type="password"
                  className="dash-input"
                  placeholder="Current password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  required
                />
                <input
                  type="password"
                  className="dash-input"
                  placeholder={`New password (at least ${MIN_PASSWORD} characters)`}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="flex items-center gap-3 flex-wrap mt-1">
                  <button type="submit" className="dash-btn dash-btn-primary">
                    Change password
                  </button>
                  {pwMsg && (
                    <span className={pwMsg.ok ? "dash-word-hint" : "text-[12.5px] text-[#f1a07d]"}>{pwMsg.text}</span>
                  )}
                </div>
              </form>
            </Panel>
          </div>
        </div>

        <div className="dash-col-6">
          <Panel eyebrow="Staying in touch" title="Email updates">
            <p className="dash-word-hint mb-3">
              {subscribed
                ? `You're on the All The Glory email list (${me.member?.email}) - the occasional note about new studies, music and videos.`
                : "Get the occasional email about new studies, music and videos from All The Glory."}
            </p>
            <button
              type="button"
              className={`dash-btn ${subscribed ? "dash-btn-ghost" : "dash-btn-primary"}`}
              onClick={() => setEmailUpdates(!subscribed)}
            >
              {subscribed ? "Unsubscribe" : "Yes, email me"}
            </button>
          </Panel>

          <div className="mt-[18px]">
            <Panel eyebrow="Your data" title="Download everything">
              <p className="dash-word-hint mb-3">
                Your notes, words and day titles in one file. Your journal is private to you - nobody else can read it.
              </p>
              <button type="button" className="dash-btn dash-btn-ghost" onClick={download} disabled={downloading}>
                {downloading ? "Preparing…" : "Download my journal"}
              </button>
            </Panel>
          </div>

          <div className="mt-[18px]">
            <Panel eyebrow="Leave" title="Delete my account">
              <form onSubmit={deleteAccount} className="flex flex-col gap-2">
                <p className="dash-word-hint">
                  Removes your account and everything in your journal for good. Download it first if you want to keep it.
                </p>
                <input
                  type="password"
                  className="dash-input"
                  placeholder="Your password"
                  autoComplete="current-password"
                  value={delPassword}
                  onChange={(e) => setDelPassword(e.target.value)}
                  required
                />
                <input
                  className="dash-input"
                  placeholder="Type DELETE to confirm"
                  value={delConfirm}
                  onChange={(e) => setDelConfirm(e.target.value)}
                  required
                />
                <div className="flex items-center gap-3 flex-wrap mt-1">
                  <button type="submit" className="dash-btn dash-btn-danger" disabled={delConfirm !== "DELETE" || !delPassword}>
                    Delete my account
                  </button>
                  {delError && <span className="text-[12.5px] text-[#f1a07d]">{delError}</span>}
                </div>
              </form>
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AccountPage() {
  return (
    <MemberOnly>
      <Account />
    </MemberOnly>
  );
}
