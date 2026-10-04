"use client";

import { useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import {
  resolveSchedule,
  resolveGuitarWeek,
  DEFAULT_SCHEDULE,
  DEFAULT_GUITAR_WEEK,
  DEFAULT_TASK_TAGS,
  ScheduleRow,
  GuitarWeekRow,
  TaskTag,
} from "@/lib/dashboard/types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function SettingsPage() {
  const { state, update, ready } = useDashboard();

  function patchSettings(patch: Partial<typeof state.settings>) {
    update((d) => {
      d.settings = { ...d.settings, ...patch };
    });
  }

  // ── Schedule ────────────────────────────────────────────────
  const schedule = resolveSchedule(state.settings);
  function patchSchedule(rows: ScheduleRow[]) {
    patchSettings({ schedule: rows });
  }
  function addScheduleRow() {
    patchSchedule([
      ...schedule,
      { id: uid(), time: "20:00", hour: 20, title: "New block", sub: "" },
    ]);
  }
  function removeScheduleRow(id: string) {
    patchSchedule(schedule.filter((r) => r.id !== id));
  }
  function updateScheduleRow(id: string, patch: Partial<ScheduleRow>) {
    patchSchedule(schedule.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function moveScheduleRow(id: string, dir: -1 | 1) {
    const rows = [...schedule];
    const i = rows.findIndex((r) => r.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    [rows[i], rows[j]] = [rows[j], rows[i]];
    patchSchedule(rows);
  }
  function resetSchedule() {
    patchSchedule(DEFAULT_SCHEDULE);
  }

  // ── Guitar week ─────────────────────────────────────────────
  const week = resolveGuitarWeek(state.settings);
  function patchWeek(rows: GuitarWeekRow[]) {
    patchSettings({ guitarWeek: rows });
  }
  function updateWeek(id: string, patch: Partial<GuitarWeekRow>) {
    patchWeek(week.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function resetWeek() {
    patchWeek(DEFAULT_GUITAR_WEEK);
  }

  // ── Task tags (custom; defaults are read-only) ───────────────
  const customTags = state.settings.taskTags ?? [];
  function patchTags(rows: TaskTag[]) {
    patchSettings({ taskTags: rows });
  }
  function addTag() {
    patchTags([...customTags, { id: `t-${uid()}`, label: "New tag", tone: "rgba(216,178,90,0.92)" }]);
  }
  function updateTag(id: string, patch: Partial<TaskTag>) {
    patchTags(customTags.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeTag(id: string) {
    patchTags(customTags.filter((r) => r.id !== id));
  }

  // ── Goals + rules ───────────────────────────────────────────
  const s = state.settings;

  // ── Admin password ──────────────────────────────────────────
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next !== pw.confirm) {
      setPwMsg({ ok: false, text: "The new passwords don't match." });
      return;
    }
    setPwBusy(true);
    setPwMsg(null);
    try {
      const r = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ current: pw.current, next: pw.next }),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (r.ok) {
        setPw({ current: "", next: "", confirm: "" });
        setPwMsg({ ok: true, text: "Password changed. Other devices will need to log in again." });
      } else {
        setPwMsg({ ok: false, text: data.error ?? "Couldn't change the password." });
      }
    } catch {
      setPwMsg({ ok: false, text: "Couldn't reach the server. Try again." });
    } finally {
      setPwBusy(false);
    }
  }

  // ── Backup + restore ────────────────────────────────────────
  // Everything is also kept on the server; this file is a personal copy.
  async function exportData() {
    // Word journal and study notes live in their own tables - include them,
    // deleted ones too, so the file is a complete record.
    const get = async (url: string, key: string) => {
      try {
        const r = await fetch(url, { cache: "no-store" });
        return r.ok ? ((await r.json()) as Record<string, unknown>)[key] : undefined;
      } catch {
        return undefined;
      }
    };
    const [words, studyNotes] = await Promise.all([get("/api/words", "words"), get("/api/study-notes", "notes")]);
    const blob = new Blob([JSON.stringify({ ...state, words: words ?? state.words, studyNotes }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atg-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  async function importDataFromFile(file: File) {
    setRestoreMsg(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (typeof parsed !== "object" || !parsed) throw new Error("Not a valid backup file.");
      if (!confirm("Replace your current dashboard data with this backup? This cannot be undone.")) return;
      // Write straight to localStorage so the existing read() merger handles
      // schema drift between versions on the next page-load.
      window.localStorage.setItem("atg:dashboard:v1", JSON.stringify(parsed));
      setRestoreMsg("Restored. Reloading…");
      setTimeout(() => window.location.reload(), 400);
    } catch (e) {
      setRestoreMsg(e instanceof Error ? e.message : "Could not read backup.");
    }
  }

  // ── Wipe ────────────────────────────────────────────────────
  function wipeAll() {
    if (!confirm("Wipe every word, task, session, and reset settings to defaults? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure?")) return;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("atg:dashboard:v1");
      window.location.reload();
    }
  }

  if (!ready) return null;

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Everything tunable</div>
          <h1 className="dash-title mt-1">Settings</h1>
          <div className="dash-subtitle">
            Edit the schedule, the tags, the guitar plan - make it yours.
          </div>
        </div>
      </div>

      <div className="dash-grid">
        {/* ── Identity + rules ────────────────────────────── */}
        <div className="dash-col-6">
          <Panel eyebrow="You" title="Greeting &amp; rhythm">
            <label className="dash-label">Greeting name</label>
            <input
              className="dash-input"
              value={s.greetingName}
              onChange={(e) => patchSettings({ greetingName: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="dash-label">Phone off hour (24h)</label>
                <input
                  type="number"
                  className="dash-input"
                  value={s.phoneOffHour}
                  onChange={(e) => patchSettings({ phoneOffHour: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
          </Panel>
        </div>

        <div className="dash-col-6">
          <Panel eyebrow="Targets" title="Goals">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="dash-label">Book word target</label>
                <input
                  type="number"
                  className="dash-input"
                  value={s.goals.bookWordTarget}
                  onChange={(e) =>
                    patchSettings({ goals: { ...s.goals, bookWordTarget: Number(e.target.value) || 0 } })
                  }
                />
              </div>
              <div>
                <label className="dash-label">Guitar min / week</label>
                <input
                  type="number"
                  className="dash-input"
                  value={s.goals.guitarMinutesPerWeek}
                  onChange={(e) =>
                    patchSettings({ goals: { ...s.goals, guitarMinutesPerWeek: Number(e.target.value) || 0 } })
                  }
                />
              </div>
            </div>
          </Panel>
        </div>

        {/* ── Daily schedule editor ──────────────────────── */}
        <div className="dash-col-12" id="schedule">
          <Panel
            eyebrow="Daily rhythm"
            title="Schedule editor"
            action={
              <div className="flex gap-2">
                <button className="dash-btn dash-btn-ghost" onClick={resetSchedule}>
                  Reset
                </button>
                <button className="dash-btn dash-btn-primary" onClick={addScheduleRow}>
                  + Add row
                </button>
              </div>
            }
          >
            <div className="flex flex-col gap-2">
              {schedule.map((row, idx) => (
                <div
                  key={row.id}
                  className="grid items-center gap-2 p-2.5 rounded-md border border-white/8 bg-white/[0.02]"
                  style={{ gridTemplateColumns: "50px 70px 70px 1fr 1.4fr 30px" }}
                >
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      className="dash-row-move"
                      onClick={() => moveScheduleRow(row.id, -1)}
                      disabled={idx === 0}
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="dash-row-move"
                      onClick={() => moveScheduleRow(row.id, 1)}
                      disabled={idx === schedule.length - 1}
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  <input
                    className="dash-input"
                    value={row.time}
                    onChange={(e) => updateScheduleRow(row.id, { time: e.target.value })}
                    placeholder="7:00"
                  />
                  <input
                    type="number"
                    step="0.25"
                    className="dash-input"
                    value={row.hour}
                    onChange={(e) =>
                      updateScheduleRow(row.id, { hour: Number(e.target.value) || 0 })
                    }
                    title="Hour as 24h decimal - used for the 'now' highlight"
                  />
                  <input
                    className="dash-input"
                    value={row.title}
                    onChange={(e) => updateScheduleRow(row.id, { title: e.target.value })}
                    placeholder="Title"
                  />
                  <input
                    className="dash-input"
                    value={row.sub}
                    onChange={(e) => updateScheduleRow(row.id, { sub: e.target.value })}
                    placeholder="Subtitle"
                  />
                  <button
                    className="opacity-80 hover:opacity-100"
                    onClick={() => removeScheduleRow(row.id)}
                    title="Delete row"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ── Tags editor ────────────────────────────── */}
        <div className="dash-col-12" id="tags">
          <Panel
            eyebrow="Custom tags"
            title="Task tag library"
            action={
              <button className="dash-btn dash-btn-primary" onClick={addTag}>
                + Add tag
              </button>
            }
          >
            <div className="text-[12px] text-[var(--colour-ink-quiet)] mb-3">
              Defaults (Personal, 2KO / Darren, All The Glory, Book, Guitar) are always available.
              Anything you add here shows up alongside them.
            </div>
            <div className="flex flex-col gap-2">
              {DEFAULT_TASK_TAGS.map((t) => (
                <div
                  key={t.id}
                  className="grid items-center gap-2 p-2.5 rounded-md border border-white/5 bg-white/[0.015] opacity-60"
                  style={{ gridTemplateColumns: "1fr 110px 30px" }}
                >
                  <span className="text-[14px]">{t.label}</span>
                  <span
                    className="rounded h-6"
                    style={{ background: t.tone }}
                    title={t.tone}
                  />
                  <span className="text-[10px] text-[var(--colour-ink-quiet)]">default</span>
                </div>
              ))}
              {customTags.map((t) => (
                <div
                  key={t.id}
                  className="grid items-center gap-2 p-2.5 rounded-md border border-white/8 bg-white/[0.02]"
                  style={{ gridTemplateColumns: "1fr 110px 30px" }}
                >
                  <input
                    className="dash-input"
                    value={t.label}
                    onChange={(e) => updateTag(t.id, { label: e.target.value })}
                  />
                  <input
                    className="dash-input"
                    value={t.tone}
                    onChange={(e) => updateTag(t.id, { tone: e.target.value })}
                    title="Any CSS colour (e.g. #d8b25a or rgba(216,178,90,0.92))"
                  />
                  <button
                    className="opacity-80 hover:opacity-100"
                    onClick={() => removeTag(t.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ── Guitar course start date ────────────────── */}
        <div className="dash-col-12" id="guitar-course">
          <Panel eyebrow="Guitar course" title="Start date">
            <p className="text-[12.5px] text-[var(--colour-ink-soft)] mb-3">
              The &ldquo;This week&apos;s lessons&rdquo; panel anchors to this Monday. Set it forward
              if you want to delay the start; the dates on the cards (Mon · 8 Jun etc.)
              update accordingly.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <div>
                <label className="dash-label">Course start (a Monday)</label>
                <input
                  type="date"
                  className="dash-input"
                  value={s.guitarCourseStartDate ?? ""}
                  onChange={(e) =>
                    patchSettings({ guitarCourseStartDate: e.target.value })
                  }
                />
              </div>
            </div>
          </Panel>
        </div>

        {/* ── Guitar week editor ────────────────────── */}
        <div className="dash-col-12" id="guitar">
          <Panel
            eyebrow="Guitar"
            title="Weekly practice plan"
            action={
              <button className="dash-btn dash-btn-ghost" onClick={resetWeek}>
                Reset to default
              </button>
            }
          >
            <div className="flex flex-col gap-2">
              {week.map((row) => (
                <div
                  key={row.id}
                  className="grid items-start gap-2 p-2.5 rounded-md border border-white/8 bg-white/[0.02]"
                  style={{ gridTemplateColumns: "70px 1fr 1.4fr 80px" }}
                >
                  <input
                    className="dash-input"
                    value={row.day}
                    onChange={(e) => updateWeek(row.id, { day: e.target.value })}
                  />
                  <input
                    className="dash-input"
                    value={row.focus}
                    onChange={(e) => updateWeek(row.id, { focus: e.target.value })}
                    placeholder="Focus"
                  />
                  <textarea
                    className="dash-textarea"
                    style={{ minHeight: 44 }}
                    value={row.drill}
                    onChange={(e) => updateWeek(row.id, { drill: e.target.value })}
                    placeholder="Drill"
                  />
                  <input
                    className="dash-input"
                    type="number"
                    value={row.minutes}
                    onChange={(e) => updateWeek(row.id, { minutes: Number(e.target.value) || 0 })}
                  />
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ── Admin password ─────────────────────── */}
        <div className="dash-col-12" id="password">
          <Panel eyebrow="Admin login" title="Change password">
            <form onSubmit={changePassword} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <input type="text" name="username" autoComplete="username" value="admin" readOnly hidden />
              <div>
                <label className="dash-label" htmlFor="pw-current">Current password</label>
                <input
                  id="pw-current"
                  type="password"
                  autoComplete="current-password"
                  className="dash-input"
                  value={pw.current}
                  onChange={(e) => setPw({ ...pw, current: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="dash-label" htmlFor="pw-next">New password</label>
                <input
                  id="pw-next"
                  type="password"
                  autoComplete="new-password"
                  className="dash-input"
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="dash-label" htmlFor="pw-confirm">New password again</label>
                <input
                  id="pw-confirm"
                  type="password"
                  autoComplete="new-password"
                  className="dash-input"
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-3 flex items-center gap-3 flex-wrap">
                <button type="submit" className="dash-btn dash-btn-primary" disabled={pwBusy}>
                  {pwBusy ? "Saving…" : "Change password"}
                </button>
                {pwMsg && (
                  <span className={`text-[12.5px] ${pwMsg.ok ? "text-[var(--colour-amber-soft)]" : "text-[#f1a07d]"}`}>
                    {pwMsg.text}
                  </span>
                )}
              </div>
            </form>
          </Panel>
        </div>

        {/* ── Backup + restore ────────────────────── */}
        <div className="dash-col-12" id="backup">
          <Panel eyebrow="Backup &amp; restore" title="Save your data">
            <p className="text-[13px] text-[var(--colour-ink-soft)] mb-3">
              Everything is saved on the server and never removed - deleted notes and words
              go to Recently deleted, edits keep their earlier versions, and a copy of the
              dashboard is kept for every day. Export gives you your own complete copy
              (words and study notes included) to keep in iCloud / Drive as well.
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <button className="dash-btn dash-btn-primary" onClick={exportData}>
                ⇣ Export to file
              </button>
              <label className="dash-btn" style={{ cursor: "pointer" }}>
                ⇡ Import from file
                <input
                  type="file"
                  accept="application/json,.json"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importDataFromFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {restoreMsg && (
                <span className="text-[12.5px] text-[var(--colour-amber-soft)]">
                  {restoreMsg}
                </span>
              )}
            </div>
          </Panel>
        </div>

        {/* ── Danger zone ──────────────────────────── */}
        <div className="dash-col-12">
          <Panel eyebrow="Danger zone" title="Reset everything">
            <p className="text-[13px] text-[var(--colour-ink-soft)] mb-3">
              Wipes words, tasks, sessions, book, settings - every byte of dashboard
              storage in this browser. Cannot be undone.
            </p>
            <button className="dash-btn dash-btn-danger" onClick={wipeAll}>
              Wipe local data
            </button>
          </Panel>
        </div>
      </div>
    </>
  );
}
