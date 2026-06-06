"use client";

import { useMemo, useState } from "react";
import { Panel, Stat, Tag } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import { Task, resolveTaskTags } from "@/lib/dashboard/types";
import { formatShort, todayISO } from "@/lib/dashboard/dates";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function TasksPage() {
  const { state, update, ready } = useDashboard();
  const [filter, setFilter] = useState<string>("open");
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState<string>("personal");
  const [due, setDue] = useState("");

  const TAGS = resolveTaskTags(state.settings);

  const tasks = useMemo(() => {
    return [...state.tasks]
      .filter((t) => {
        if (filter === "all") return true;
        if (filter === "open") return !t.done;
        if (filter === "done") return t.done;
        return t.tag === filter;
      })
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (a.due && b.due) return a.due.localeCompare(b.due);
        if (a.due) return -1;
        if (b.due) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [state.tasks, filter]);

  function add(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim()) return;
    const t: Task = {
      id: uid(),
      title: title.trim(),
      tag,
      done: false,
      createdAt: new Date().toISOString(),
      due: due || undefined,
    };
    update((d) => {
      d.tasks.unshift(t);
    });
    setTitle("");
    setDue("");
  }

  function toggle(id: string) {
    update((d) => {
      const task = d.tasks.find((x) => x.id === id);
      if (!task) return;
      task.done = !task.done;
      task.completedAt = task.done ? new Date().toISOString() : undefined;
    });
  }

  function remove(id: string) {
    update((d) => {
      d.tasks = d.tasks.filter((x) => x.id !== id);
    });
  }

  const today = todayISO();
  const openCount = state.tasks.filter((t) => !t.done).length;
  const overdue = state.tasks.filter((t) => !t.done && t.due && t.due < today).length;
  const dueToday = state.tasks.filter((t) => !t.done && t.due === today).length;
  const doneToday = state.tasks.filter(
    (t) => t.done && t.completedAt?.slice(0, 10) === today,
  ).length;

  const byTag = TAGS.map((tg) => ({
    ...tg,
    count: state.tasks.filter((t) => t.tag === tg.id && !t.done).length,
  }));

  if (!ready) return null;

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Personal · 2KO · Glory · Book · Guitar</div>
          <h1 className="dash-title mt-1">Tasks</h1>
          <div className="dash-subtitle">One list, tagged by where the work lives.</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col-3">
          <Stat label="Open" value={openCount} hint="Across all tags" />
        </div>
        <div className="dash-col-3">
          <Stat label="Due today" value={dueToday} tone="warn" />
        </div>
        <div className="dash-col-3">
          <Stat label="Overdue" value={overdue} tone={overdue > 0 ? "warn" : "ok"} />
        </div>
        <div className="dash-col-3">
          <Stat label="Done today" value={doneToday} tone="ok" />
        </div>

        <div className="dash-col-12">
          <Panel eyebrow="Add a task" title="What needs to happen?">
            <form onSubmit={add} className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[220px]">
                <label className="dash-label">Title</label>
                <input
                  className="dash-input"
                  placeholder="e.g. Finish 2KO landing copy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div style={{ minWidth: 160 }}>
                <label className="dash-label">Tag</label>
                <select
                  className="dash-select"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                >
                  {TAGS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ minWidth: 160 }}>
                <label className="dash-label">Due (optional)</label>
                <input
                  type="date"
                  className="dash-input"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
              </div>
              <button type="submit" className="dash-btn dash-btn-primary">
                Add
              </button>
            </form>
          </Panel>
        </div>

        <div className="dash-col-12">
          <Panel
            eyebrow="The list"
            title="All tasks"
            action={
              <div className="flex flex-wrap gap-1.5">
                {(["open", "all", "done"] as const).map((f) => (
                  <button
                    key={f}
                    className={`chip ${filter === f ? "chip-active" : ""}`}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
                {byTag.map((t) => (
                  <button
                    key={t.id}
                    className={`chip ${filter === t.id ? "chip-active" : ""}`}
                    onClick={() => setFilter(t.id)}
                  >
                    {t.label} · {t.count}
                  </button>
                ))}
              </div>
            }
          >
            {tasks.length === 0 ? (
              <div className="dash-empty">
                Nothing here. Add a task above, or change the filter.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {tasks.map((t) => {
                  const tg = TAGS.find((x) => x.id === t.tag) ?? TAGS[0];
                  const overdue = !t.done && t.due && t.due < today;
                  return (
                    <div key={t.id} className={`dash-task ${t.done ? "is-done" : ""}`}>
                      <button
                        type="button"
                        className={`dash-check-dot ${t.done ? "is-on" : ""}`}
                        style={
                          t.done
                            ? { background: "var(--colour-amber)", borderColor: "var(--colour-amber)" }
                            : undefined
                        }
                        onClick={() => toggle(t.id)}
                        aria-label="Toggle"
                      >
                        {t.done ? "✓" : ""}
                      </button>
                      <span className="dash-task-title">{t.title}</span>
                      <Tag tone={tg.tone}>{tg.label}</Tag>
                      <span
                        className="dash-task-due"
                        style={overdue ? { color: "#f1a07d" } : undefined}
                      >
                        {t.due ? formatShort(t.due) : "-"}
                        <button
                          onClick={() => remove(t.id)}
                          className="ml-3 opacity-50 hover:opacity-100"
                          aria-label="Delete"
                        >
                          ✕
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
