"use client";

import { useMemo, useState } from "react";
import { Panel, Stat } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import { formatShort, startOfWeek, todayISO, weekdayShort, addDays } from "@/lib/dashboard/dates";
import Link from "next/link";
import {
  GuitarSession,
  resolveGuitarWeek,
  resolveCourse,
  emptyHabits,
  CourseLesson,
} from "@/lib/dashboard/types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function GuitarPage() {
  const { state, update, ready } = useDashboard();
  const today = todayISO();
  const weekStart = startOfWeek(today);
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const WEEK_PLAN = resolveGuitarWeek(state.settings);
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const [minutes, setMinutes] = useState<number>(25);
  const [focus, setFocus] = useState<string>(WEEK_PLAN[todayIdx]?.focus ?? "");
  const [notes, setNotes] = useState("");

  function addSession(e?: React.FormEvent) {
    e?.preventDefault();
    if (!focus.trim() || !minutes) return;
    const s: GuitarSession = {
      id: uid(),
      date: today,
      minutes,
      focus: focus.trim(),
      notes: notes.trim() || undefined,
    };
    update((d) => {
      d.guitar.unshift(s);
      const h = d.habits[today] ?? emptyHabits();
      h["guitar"] = true;
      d.habits[today] = h;
    });
    setNotes("");
  }

  function removeSession(id: string) {
    update((d) => {
      d.guitar = d.guitar.filter((s) => s.id !== id);
    });
  }

  const sessionsByDate: Record<string, number> = {};
  for (const s of state.guitar) {
    sessionsByDate[s.date] = (sessionsByDate[s.date] || 0) + s.minutes;
  }
  const weekMinutes = week.reduce((sum, d) => sum + (sessionsByDate[d] || 0), 0);
  const target = state.settings.goals.guitarMinutesPerWeek;
  const totalMinutes = state.guitar.reduce((sum, s) => sum + s.minutes, 0);

  // ── Udemy course tracker ────────────────────────────────────────
  const course = resolveCourse(state.settings);
  // Group lessons by section for the all-lessons list.
  const sections = useMemo(() => {
    const map = new Map<string, { title: string; lessons: CourseLesson[] }>();
    for (const l of course) {
      const key = l.section;
      const existing = map.get(key);
      if (existing) existing.lessons.push(l);
      else map.set(key, { title: l.sectionTitle ?? `Section ${l.section}`, lessons: [l] });
    }
    return [...map.entries()].map(([key, v]) => ({ key, ...v }));
  }, [course]);

  // Plan week is anchored to settings.guitarCourseStartDate (defaults to
  // next Monday on first load). Until the calendar catches up to that
  // Monday, the cards show the FUTURE start week instead of the current one.
  const planWeekStart = useMemo(() => {
    const start = state.settings.guitarCourseStartDate ?? weekStart;
    return start > weekStart ? start : weekStart;
  }, [state.settings.guitarCourseStartDate, weekStart]);
  const planWeek = useMemo(
    () => Array.from({ length: 5 }, (_, i) => addDays(planWeekStart, i)),
    [planWeekStart],
  );

  // 5-day-a-week plan: Mon/Wed/Fri = new lesson, Tue/Thu = consolidate.
  // We pick the next 3 not-yet-done lessons; in-progress ones come first.
  const lessonPlan = useMemo(() => {
    const undone = course.filter((l) => l.status !== "done");
    const order = [...undone].sort((a, b) => {
      if (a.status === b.status) return a.number - b.number;
      return a.status === "in-progress" ? -1 : 1;
    });
    const picks = order.slice(0, 3);
    const days = [
      { name: "Mon", date: planWeek[0], role: "New lesson", lesson: picks[0] ?? null, consolidate: false },
      { name: "Tue", date: planWeek[1], role: "Consolidate", lesson: picks[0] ?? null, consolidate: true },
      { name: "Wed", date: planWeek[2], role: "New lesson", lesson: picks[1] ?? null, consolidate: false },
      { name: "Thu", date: planWeek[3], role: "Consolidate", lesson: picks[1] ?? null, consolidate: true },
      { name: "Fri", date: planWeek[4], role: "New lesson", lesson: picks[2] ?? null, consolidate: false },
    ];
    return days as {
      name: string;
      date: string;
      role: string;
      lesson: CourseLesson | null;
      consolidate: boolean;
    }[];
  }, [course, planWeek]);

  function setLessonStatus(id: string, status: CourseLesson["status"]) {
    update((d) => {
      const c = d.settings.guitarCourse ?? course;
      d.settings.guitarCourse = c.map((l) => (l.id === id ? { ...l, status } : l));
    });
  }
  function restartCourse() {
    if (!confirm("Reset every lesson back to todo? You'll start the course from #1.")) return;
    update((d) => {
      const c = d.settings.guitarCourse ?? course;
      d.settings.guitarCourse = c.map((l) => ({ ...l, status: "todo" as const }));
    });
  }

  // ── Inline "+ Add lesson" form (so the user can extend the course
  //    without touching Settings each time the screenshots arrive). ──
  const [lessonOpen, setLessonOpen] = useState(false);
  const [lTitle, setLTitle] = useState("");
  const [lMinutes, setLMinutes] = useState(5);
  const [lSection, setLSection] = useState("2");
  function addLesson(e?: React.FormEvent) {
    e?.preventDefault();
    if (!lTitle.trim()) return;
    update((d) => {
      const c = d.settings.guitarCourse ?? course;
      const nextNumber = (c.reduce((m, l) => Math.max(m, l.number), 0) || 0) + 1;
      const lesson: CourseLesson = {
        id: `u-${uid()}`,
        section: lSection,
        sectionTitle: c.find((l) => l.section === lSection)?.sectionTitle,
        number: nextNumber,
        title: lTitle.trim(),
        minutes: lMinutes,
        status: "todo",
      };
      d.settings.guitarCourse = [...c, lesson];
    });
    setLTitle("");
    setLessonOpen(false);
  }

  const undoneCount = course.filter((l) => l.status !== "done").length;
  const doneCount = course.length - undoneCount;
  const pctDone = course.length ? Math.round((doneCount / course.length) * 100) : 0;

  if (!ready) return null;

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Weekly practice plan</div>
          <h1 className="dash-title mt-1">Guitar</h1>
          <div className="dash-subtitle">A rotating week. Show up small, often.</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col-4">
          <Stat label="This week" value={`${weekMinutes} min`} hint={`Target: ${target} min`} />
        </div>
        <div className="dash-col-4">
          <Stat label="Lifetime minutes" value={totalMinutes} tone="calm" />
        </div>
        <div className="dash-col-4">
          <Stat label="Sessions logged" value={state.guitar.length} tone="ok" />
        </div>

        {/* Weekly rotation panel removed per user request - the Udemy course
            plan below handles the weekly cadence now. */}

        {/* ─── Udemy course tracker ─── */}
        <div className="dash-col-12">
          <Panel
            eyebrow={`Udemy course · ${doneCount} of ${course.length} done · ${pctDone}%`}
            title="This week's lessons"
            action={
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  className="dash-btn dash-btn-ghost"
                  style={{ padding: "6px 12px", fontSize: 11 }}
                  onClick={restartCourse}
                  title="Reset every lesson to todo"
                >
                  ↻ Restart course
                </button>
                <button
                  type="button"
                  className="dash-btn dash-btn-primary"
                  style={{ padding: "6px 12px", fontSize: 11 }}
                  onClick={() => setLessonOpen((v) => !v)}
                >
                  {lessonOpen ? "Close" : "+ Add lesson"}
                </button>
              </div>
            }
          >
            <p className="text-[12.5px] text-[var(--colour-ink-soft)] mb-3">
              5 days a week. New lessons on <strong>Mon · Wed · Fri</strong>; Tue and Thu
              consolidate yesterday&apos;s. If a lesson runs long, mark it{" "}
              <strong>in progress</strong> - it stays at the front of the queue.
            </p>

            {lessonOpen && (
              <form onSubmit={addLesson} className="dash-add-block mb-3">
                <input
                  type="text"
                  className="dash-input"
                  placeholder="Lesson title (e.g. 19. Chord Inversions)"
                  value={lTitle}
                  onChange={(e) => setLTitle(e.target.value)}
                  style={{ flex: 1 }}
                  autoFocus
                />
                <input
                  type="number"
                  className="dash-input"
                  placeholder="min"
                  value={lMinutes}
                  onChange={(e) => setLMinutes(Number(e.target.value) || 0)}
                  style={{ width: 80 }}
                />
                <input
                  type="text"
                  className="dash-input"
                  placeholder="Section"
                  value={lSection}
                  onChange={(e) => setLSection(e.target.value)}
                  style={{ width: 80 }}
                />
                <button type="submit" className="dash-btn dash-btn-primary">
                  Add
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {lessonPlan.map((p, i) => {
                const isToday = p.date === today;
                return (
                <div
                  key={i}
                  className={`p-3 rounded-md border ${
                    isToday
                      ? "border-[rgba(216,178,90,0.55)] bg-[rgba(216,178,90,0.10)]"
                      : p.consolidate
                      ? "border-white/6 bg-white/[0.015]"
                      : "border-[rgba(216,178,90,0.32)] bg-[rgba(216,178,90,0.05)]"
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-[14px] text-[var(--colour-amber-soft)]">
                      {p.name} · {formatShort(p.date)}
                      {isToday && (
                        <span className="ml-2 text-[10px] eyebrow eyebrow-amber">TODAY</span>
                      )}
                    </span>
                    <span className="text-[10px] text-[var(--colour-ink-quiet)] eyebrow">
                      {p.role}
                    </span>
                  </div>
                  {p.lesson ? (
                    <>
                      <div className="text-[12.5px] mt-2 text-[var(--colour-ink-strong)]">
                        #{p.lesson.number} · {p.lesson.title}
                      </div>
                      <div className="text-[11px] text-[var(--colour-ink-quiet)] mt-1">
                        {p.lesson.minutes} min{p.lesson.hasResources ? " · resources" : ""}
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setLessonStatus(p.lesson!.id, "in-progress")}
                          className={`dash-btn ${
                            p.lesson.status === "in-progress"
                              ? "dash-btn-primary"
                              : "dash-btn-ghost"
                          }`}
                          style={{ padding: "4px 8px", fontSize: 10 }}
                        >
                          Start
                        </button>
                        <button
                          type="button"
                          onClick={() => setLessonStatus(p.lesson!.id, "done")}
                          className={`dash-btn ${
                            p.lesson.status === "done"
                              ? "dash-btn-primary"
                              : "dash-btn-ghost"
                          }`}
                          style={{ padding: "4px 8px", fontSize: 10 }}
                        >
                          ✓ Done
                        </button>
                        {p.lesson.status !== "todo" && (
                          <button
                            type="button"
                            onClick={() => setLessonStatus(p.lesson!.id, "todo")}
                            className="dash-btn dash-btn-ghost"
                            style={{ padding: "4px 8px", fontSize: 10 }}
                            title="Reset this lesson back to todo"
                          >
                            ↶ Undo
                          </button>
                        )}
                      </div>
                      {p.lesson.status === "in-progress" && (
                        <div className="text-[10px] mt-1 text-[var(--colour-amber-soft)]">
                          in progress
                        </div>
                      )}
                      {p.lesson.status === "done" && (
                        <div className="text-[10px] mt-1 text-[var(--colour-amber-soft)]">
                          ✓ done
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-[12px] text-[var(--colour-ink-quiet)] mt-2">
                      Nothing queued - add lessons below.
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="dash-col-12">
          <Panel eyebrow="All lessons" title="Course progress">
            <div className="flex flex-col gap-4">
              {sections.map((sec) => (
                <div key={sec.key}>
                  <div className="eyebrow eyebrow-amber mb-2">{sec.title}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {sec.lessons.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() =>
                          setLessonStatus(
                            l.id,
                            l.status === "done"
                              ? "todo"
                              : l.status === "todo"
                              ? "in-progress"
                              : "done",
                          )
                        }
                        className={`flex items-center gap-2 p-2 rounded-md border text-left transition ${
                          l.status === "done"
                            ? "border-white/5 bg-white/[0.015] opacity-60"
                            : l.status === "in-progress"
                            ? "border-[rgba(216,178,90,0.45)] bg-[rgba(216,178,90,0.06)]"
                            : "border-white/8 bg-white/[0.02] hover:bg-white/[0.05]"
                        }`}
                      >
                        <span
                          className={`dash-check-dot ${l.status === "done" ? "is-on" : ""}`}
                          style={
                            l.status === "in-progress"
                              ? { background: "rgba(216,178,90,0.4)", borderColor: "var(--colour-amber)" }
                              : undefined
                          }
                        >
                          {l.status === "done" ? "✓" : l.status === "in-progress" ? "·" : ""}
                        </span>
                        <span className="text-[12px] text-[var(--colour-ink-quiet)] w-6">
                          #{l.number}
                        </span>
                        <span
                          className={`text-[13px] flex-1 ${
                            l.status === "done" ? "line-through" : "text-[var(--colour-ink-strong)]"
                          }`}
                        >
                          {l.title}
                        </span>
                        <span className="text-[11px] text-[var(--colour-ink-quiet)]">
                          {l.minutes}m{l.hasResources ? " · 📎" : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="dash-divider" />
            <div className="text-[11.5px] text-[var(--colour-ink-quiet)] leading-relaxed">
              Click any lesson to cycle <strong>todo → in progress → done → todo</strong>.
              In-progress lessons stay at the front of the &ldquo;This week&rdquo; queue
              so multi-day videos don&apos;t get skipped.
            </div>
          </Panel>
        </div>

        <div className="dash-col-4">
          <Panel eyebrow="Log a session" title="Today">
            <form onSubmit={addSession} className="flex flex-col gap-3">
              <div>
                <label className="dash-label">Focus</label>
                <input
                  className="dash-input"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                />
              </div>
              <div>
                <label className="dash-label">Minutes</label>
                <input
                  type="number"
                  className="dash-input"
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="dash-label">Notes</label>
                <textarea
                  className="dash-textarea"
                  placeholder="What clicked? What was clumsy?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <button type="submit" className="dash-btn dash-btn-primary">
                Log session
              </button>
            </form>
          </Panel>
        </div>

        <div className="dash-col-12">
          <Panel eyebrow="History" title="Recent sessions">
            {state.guitar.length === 0 ? (
              <div className="dash-empty">No sessions logged yet. Pick up the guitar.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {state.guitar.slice(0, 24).map((s) => (
                  <div
                    key={s.id}
                    className="grid items-start gap-3 p-3 rounded-md border border-white/6 bg-white/[0.02]"
                    style={{ gridTemplateColumns: "100px 1fr 60px auto" }}
                  >
                    <div className="text-[12px] text-[var(--colour-amber-soft)]">{formatShort(s.date)}</div>
                    <div>
                      <div className="text-[14px] text-[var(--colour-ink-strong)]">{s.focus}</div>
                      {s.notes && (
                        <div className="text-[12.5px] text-[var(--colour-ink-soft)] mt-0.5">{s.notes}</div>
                      )}
                    </div>
                    <div className="font-display text-[16px] text-[var(--colour-glow)] text-right">
                      {s.minutes}
                    </div>
                    <button
                      onClick={() => removeSession(s.id)}
                      className="opacity-50 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
