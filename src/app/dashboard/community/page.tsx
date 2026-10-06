"use client";

// The owner's side of The Study's community: answer members' questions (and
// choose which answers to share as Q&A), approve or decline testimonies
// (nothing appears until approved), see reported posts, post the weekly
// reflection and read members' private check-in replies.

import { SuggestionsPanel, type Suggestion } from "@/components/dashboard/suggestions-panel";
import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { GrowingTextarea } from "@/components/dashboard/growing-textarea";
import { NoteText } from "@/components/dashboard/note-text";
import { dayLabel } from "@/lib/dashboard/notes";

interface Post {
  id: string;
  kind: string;
  status: string;
  shownAs: string;
  member: string;
  email: string;
  day: string | null;
  ref: string | null;
  title: string | null;
  text: string;
  createdAt: number;
  reports: number;
  reportReasons: string;
}
interface Weekly {
  id: string;
  title: string;
  body: string;
  question: string | null;
  memoryVerse?: string | null;
  authorName?: string | null;
  publishedAt: number;
  replies: number;
}
interface Question {
  id: string;
  text: string;
  ref: string | null;
  status: string;
  answer: string | null;
  answeredBy: string | null;
  answeredAt: number | null;
  published: boolean;
  member: string;
  email: string;
  createdAt: number;
}
interface Reply {
  id: string;
  reflectionId: string;
  text: string;
  createdAt: number;
  read: boolean;
  member: string;
  email: string;
}

const when = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const shortWhen = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

async function api<T>(method: string, body?: unknown, query = ""): Promise<T> {
  const r = await fetch(`/api/members/community${query}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (r.status === 401) {
    window.location.assign("/dashboard/login?next=/dashboard/community");
    throw new Error("Please log in again.");
  }
  const data = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(data.error ?? `Request failed (${r.status})`);
  return data;
}

function PostCard({ p, onStatus }: { p: Post; onStatus: (id: string, status: "approved" | "declined") => void }) {
  return (
    <div className={`dash-mod-card ${p.reports ? "is-reported" : ""}`}>
      <div className="dash-mod-meta">
        <span className="dash-mod-kind">{p.kind === "testimony" ? "Testimony" : "Reflection"}</span>
        {p.ref && <span>{p.ref}</span>}
        {p.day && <span>{dayLabel(p.day, { weekday: false })}</span>}
        <span>
          {p.member} ({p.email}) · shows as <strong>{p.shownAs}</strong>
        </span>
        <span>{when(p.createdAt)}</span>
      </div>
      {p.title && <div className="dash-mod-title">{p.title}</div>}
      <div className="dash-mod-text">
        <NoteText text={p.text} />
      </div>
      {p.reports > 0 && (
        <div className="dash-mod-report">
          ⚑ Reported {p.reports}× {p.reportReasons ? `- ${p.reportReasons}` : ""}
        </div>
      )}
      <div className="flex gap-2 mt-3">
        {p.status !== "approved" && (
          <button type="button" className="dash-btn dash-btn-primary dash-note-nav" onClick={() => onStatus(p.id, "approved")}>
            {p.status === "declined" ? "Approve after all" : "Approve"}
          </button>
        )}
        {p.status !== "declined" && (
          <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => onStatus(p.id, "declined")}>
            {p.status === "approved" ? "Hide it" : "Decline"}
          </button>
        )}
        {p.reports > 0 && p.status === "approved" && (
          <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => onStatus(p.id, "approved")}>
            Keep it (clear reports)
          </button>
        )}
      </div>
    </div>
  );
}

export default function CommunityAdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [weekly, setWeekly] = useState<Weekly[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, { text: string; publish: boolean }>>({});
  const [showAnswered, setShowAnswered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraftState] = useState({
    title: "",
    body: "",
    question: "How are you doing this week - what's God been showing you?",
    memoryVerse: "",
  });
  // The reflection being written is kept on this device until it's posted,
  // so closing the tab (or a hiccup when posting) never loses it.
  const DRAFT_KEY = "atg:community:weeklyDraft";
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? "null") as typeof draft | null;
      if (saved && (saved.title || saved.body)) setDraftState((d) => ({ ...d, ...saved }));
    } catch {
      // private window
    }
  }, []);
  const setDraft = (next: typeof draft) => {
    setDraftState(next);
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    } catch {
      // storage full / private window
    }
  };
  const [posting, setPosting] = useState(false);
  const [showShared, setShowShared] = useState(false);

  function load() {
    api<{ posts: Post[]; weekly: Weekly[]; replies: Reply[]; questions: Question[]; suggestions?: Suggestion[] }>("GET")
      .then((d) => {
        setQuestions(d.questions);
        setSuggestions(d.suggestions ?? []);
        setPosts(d.posts);
        setWeekly(d.weekly);
        setReplies(d.replies);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }
  useEffect(load, []);

  const pending = useMemo(() => posts.filter((p) => p.status === "pending"), [posts]);
  const reported = useMemo(() => posts.filter((p) => p.status === "approved" && p.reports > 0), [posts]);
  const shared = useMemo(() => posts.filter((p) => p.status === "approved"), [posts]);
  const unread = replies.filter((r) => !r.read).length;

  async function setStatus(id: string, status: "approved" | "declined") {
    try {
      await api("PATCH", { post: id, status });
      setPosts((list) => list.map((p) => (p.id === id ? { ...p, status, reports: status === "approved" ? 0 : p.reports } : p)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't save that.");
    }
  }

  const openQuestions = questions.filter((q) => q.status === "open");
  const answeredQuestions = questions.filter((q) => q.status === "answered");

  async function answerQuestion(q: Question) {
    const a = answers[q.id];
    if (!a?.text.trim()) return;
    try {
      await api("PATCH", { question: q.id, answer: a.text, publish: a.publish });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't save that.");
    }
  }
  async function setPublished(q: Question, publish: boolean) {
    await api("PATCH", { question: q.id, publish }).catch(() => {});
    setQuestions((list) => list.map((x) => (x.id === q.id ? { ...x, published: publish } : x)));
  }
  async function removeQuestion(q: Question) {
    if (!confirm("Remove this question for good?")) return;
    await api("DELETE", undefined, `?question=${encodeURIComponent(q.id)}`).catch(() => {});
    setQuestions((list) => list.filter((x) => x.id !== q.id));
  }

  async function publish() {
    if (!draft.title.trim() || !draft.body.trim()) return;
    setPosting(true);
    try {
      const { weekly: w } = await api<{ weekly: Weekly }>("POST", { weekly: draft });
      setWeekly((list) => [w, ...list]);
      setDraft({ title: "", body: "", question: draft.question, memoryVerse: "" });
      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {
        // private window
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't post that.");
    } finally {
      setPosting(false);
    }
  }

  // Posted reflections: open one to read it, Edit to change it.
  const [openWeekly, setOpenWeekly] = useState<string | null>(null);
  const [editWeekly, setEditWeekly] = useState<{ id: string; title: string; body: string; question: string; memoryVerse: string } | null>(null);
  const [savingWeekly, setSavingWeekly] = useState(false);
  async function saveWeekly() {
    if (!editWeekly || savingWeekly) return;
    setSavingWeekly(true);
    try {
      const { memoryVerse } = await api<{ memoryVerse: string | null }>("PATCH", {
        weekly: editWeekly.id,
        title: editWeekly.title,
        body: editWeekly.body,
        question: editWeekly.question,
        memoryVerse: editWeekly.memoryVerse,
      });
      setWeekly((list) =>
        list.map((x) =>
          x.id === editWeekly.id
            ? { ...x, title: editWeekly.title.trim(), body: editWeekly.body.trim(), question: editWeekly.question.trim() || null, memoryVerse }
            : x,
        ),
      );
      setEditWeekly(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't save that.");
    } finally {
      setSavingWeekly(false);
    }
  }

  async function takeDown(w: Weekly) {
    if (!confirm(`Take down "${w.title}"? Members won't see it any more. Replies are kept.`)) return;
    await api("DELETE", undefined, `?weekly=${encodeURIComponent(w.id)}`).catch(() => {});
    setWeekly((list) => list.filter((x) => x.id !== w.id));
  }

  async function markRead(id: string | "all") {
    await api("PATCH", { reply: id, read: true }).catch(() => {});
    setReplies((list) => list.map((r) => (id === "all" || r.id === id ? { ...r, read: true } : r)));
  }

  const titleOf = (id: string) => weekly.find((w) => w.id === id)?.title ?? "An earlier reflection";

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">The Study · members only</div>
          <h1 className="dash-title mt-1">Community</h1>
          <div className="dash-subtitle">
            Members&apos; questions and testimonies wait here for you. Only you and your helpers answer questions, nothing
            is shown until you approve it, and only signed-in members ever see it.
          </div>
        </div>
        <a className="dash-btn dash-btn-ghost" href="/study/community" target="_blank" rel="noreferrer">
          See it as a member ↗
        </a>
      </div>

      {error && <div className="dash-word-note mb-4">{error}</div>}

      <div className="dash-grid">
        <div className="dash-col-7">
          <Panel eyebrow={`${openQuestions.length} to answer`} title="Questions">
            {openQuestions.length === 0 && <p className="dash-word-hint">No questions waiting.</p>}
            <div className="flex flex-col gap-3">
              {openQuestions.map((q) => (
                <div key={q.id} className="dash-mod-card">
                  <div className="dash-mod-meta">
                    <strong>{q.member}</strong>
                    <span>{q.email}</span>
                    {q.ref && <span>{q.ref}</span>}
                    <span>{when(q.createdAt)}</span>
                  </div>
                  <p className="dash-question mt-2">{q.text}</p>
                  <GrowingTextarea
                    className="dash-textarea dash-word-field mt-2"
                    placeholder="Your answer…"
                    value={answers[q.id]?.text ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: { text: e.target.value, publish: a[q.id]?.publish ?? true } }))}
                  />
                  <label className="dash-day-share mt-2">
                    <input
                      type="checkbox"
                      checked={answers[q.id]?.publish ?? true}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: { text: a[q.id]?.text ?? "", publish: e.target.checked } }))}
                    />
                    Share the question and answer for everyone - members and The Study page (the asker is never named). Untick if it&apos;s personal.
                  </label>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      className="dash-btn dash-btn-primary dash-note-nav"
                      disabled={!answers[q.id]?.text.trim()}
                      onClick={() => answerQuestion(q)}
                    >
                      Send answer
                    </button>
                    <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => removeQuestion(q)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {answeredQuestions.length > 0 && (
              <button type="button" className="dash-word-link mt-4" onClick={() => setShowAnswered((v) => !v)}>
                {showAnswered ? "Hide" : "Show"} answered questions · {answeredQuestions.length}
              </button>
            )}
            {showAnswered && (
              <div className="flex flex-col gap-3 mt-3">
                {answeredQuestions.map((q) => (
                  <div key={q.id} className="dash-mod-card">
                    <div className="dash-mod-meta">
                      <strong>{q.member}</strong>
                      {q.ref && <span>{q.ref}</span>}
                      <span>answered by {q.answeredBy ?? "you"}</span>
                      {q.published && <span className="dash-mod-kind">Shared as Q&amp;A</span>}
                    </div>
                    <p className="dash-question mt-2">{q.text}</p>
                    <div className="dash-answer">
                      <NoteText text={q.answer ?? ""} />
                    </div>
                    <div className="flex gap-3 mt-2">
                      <button type="button" className="dash-word-link" onClick={() => setPublished(q, !q.published)}>
                        {q.published ? "Stop sharing" : "Share for everyone (anonymous)"}
                      </button>
                      <button type="button" className="dash-word-link" onClick={() => removeQuestion(q)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <div className="mt-[18px]">
            <SuggestionsPanel
              items={suggestions}
              onChange={(x) => setSuggestions((list) => list.map((y) => (y.id === x.id ? x : y)))}
            />
          </div>

          <div className="mt-[18px]">
          <Panel eyebrow={`${pending.length} waiting`} title="Testimonies waiting for you">
            {pending.length === 0 && <p className="dash-word-hint">All clear - nothing waiting.</p>}
            <div className="flex flex-col gap-3">
              {pending.map((p) => (
                <PostCard key={p.id} p={p} onStatus={setStatus} />
              ))}
            </div>
          </Panel>
          </div>

          {reported.length > 0 && (
            <div className="mt-[18px]">
              <Panel eyebrow="Members flagged these" title={`Reported · ${reported.length}`}>
                <div className="flex flex-col gap-3">
                  {reported.map((p) => (
                    <PostCard key={p.id} p={p} onStatus={setStatus} />
                  ))}
                </div>
              </Panel>
            </div>
          )}

          <div className="mt-[18px]">
            <Panel
              eyebrow={`${shared.length} shared`}
              title="Testimonies shared"
              action={
                <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => setShowShared((v) => !v)}>
                  {showShared ? "Hide" : "Show"}
                </button>
              }
            >
              {!showShared && <p className="dash-word-hint">Everything you&apos;ve approved. You can hide any of it later.</p>}
              {showShared && (
                <div className="flex flex-col gap-3">
                  {shared.length === 0 && <p className="dash-word-hint">Nothing shared yet.</p>}
                  {shared.map((p) => (
                    <PostCard key={p.id} p={p} onStatus={setStatus} />
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>

        <div className="dash-col-5">
          <Panel eyebrow="Weekly" title="This week's reflection">
            <p className="dash-word-hint mb-3">
              Shows on every member&apos;s home page and Community page. Replies to the check-in come only to you.
            </p>
            <input
              className="dash-input"
              placeholder="Title, e.g. Living water"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <GrowingTextarea
              className="dash-textarea dash-word-field mt-2"
              minRows={6}
              placeholder="Your reflection for the week…"
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            />
            <label className="dash-label mt-3" htmlFor="cq">
              Check-in question · optional
            </label>
            <input
              id="cq"
              className="dash-input"
              value={draft.question}
              onChange={(e) => setDraft({ ...draft, question: e.target.value })}
            />
            <label className="dash-label mt-3" htmlFor="cmv">
              Memory verse for the week · optional
            </label>
            <input
              id="cmv"
              className="dash-input"
              placeholder="e.g. John 4:14"
              value={draft.memoryVerse}
              onChange={(e) => setDraft({ ...draft, memoryVerse: e.target.value })}
            />
            <p className="dash-word-hint mt-1">
              Members see it on their home page with the words (BSB) and a link to the NIV, and tick it when they know it by
              heart.
            </p>
            <button
              type="button"
              className="dash-btn dash-btn-primary mt-3"
              disabled={posting || !draft.title.trim() || !draft.body.trim()}
              onClick={publish}
            >
              {posting ? "Posting…" : "Post to members"}
            </button>
            <p className="dash-word-hint mt-2">
              To email it too, download your email list on the Members page and send it as a Brevo campaign - Brevo adds the
              unsubscribe link for you.
            </p>

            {weekly.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                <div className="eyebrow">Posted · tap one to read or edit it</div>
                <div className="dash-note-list">
                  {weekly.map((w, i) => {
                    const isOpen = openWeekly === w.id;
                    const isEditing = editWeekly?.id === w.id;
                    return (
                      <article key={w.id} className={`dash-note ${isOpen ? "is-open" : ""}`}>
                        <button
                          type="button"
                          className="dash-note-head"
                          onClick={() => {
                            setOpenWeekly(isOpen ? null : w.id);
                            if (isOpen) setEditWeekly(null);
                          }}
                          aria-expanded={isOpen}
                        >
                          <span className="dash-note-head-ref">{shortWhen(w.publishedAt)}</span>
                          <span className="dash-note-head-text">
                            {w.title}
                            {i === 0 ? " · showing now" : ""}
                          </span>
                          <span className="dash-note-chev" aria-hidden>
                            ›
                          </span>
                        </button>
                        {isOpen && (
                          <div className="dash-note-open">
                            {isEditing ? (
                              <div className="flex flex-col gap-2">
                                <input
                                  className="dash-input"
                                  value={editWeekly.title}
                                  onChange={(e) => setEditWeekly({ ...editWeekly, title: e.target.value })}
                                  aria-label="Title"
                                />
                                <GrowingTextarea
                                  className="dash-textarea dash-word-field"
                                  minRows={6}
                                  value={editWeekly.body}
                                  onChange={(e) => setEditWeekly({ ...editWeekly, body: e.target.value })}
                                  aria-label="Reflection"
                                />
                                <label className="dash-label mt-1">Check-in question · optional</label>
                                <input
                                  className="dash-input"
                                  value={editWeekly.question}
                                  onChange={(e) => setEditWeekly({ ...editWeekly, question: e.target.value })}
                                />
                                <label className="dash-label mt-1">Memory verse · optional</label>
                                <input
                                  className="dash-input"
                                  placeholder="e.g. John 4:14 or Hebrews 12:1-13"
                                  value={editWeekly.memoryVerse}
                                  onChange={(e) => setEditWeekly({ ...editWeekly, memoryVerse: e.target.value })}
                                />
                                <div className="flex gap-2 mt-1">
                                  <button type="button" className="dash-btn dash-btn-primary dash-note-nav" onClick={saveWeekly} disabled={savingWeekly}>
                                    {savingWeekly ? "Saving…" : "Save changes"}
                                  </button>
                                  <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => setEditWeekly(null)}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="dash-word-hint mb-2">
                                  {when(w.publishedAt)}
                                  {w.authorName ? ` · by ${w.authorName}` : ""} · {w.replies} {w.replies === 1 ? "reply" : "replies"}
                                </div>
                                <div className="dash-community-body">
                                  <NoteText text={w.body} />
                                </div>
                                {w.question && (
                                  <p className="dash-word-hint mt-2">
                                    Check-in: <em>{w.question}</em>
                                  </p>
                                )}
                                <p className="dash-word-hint mt-1">
                                  Memory verse: {w.memoryVerse ? <strong>{w.memoryVerse}</strong> : "none"}
                                </p>
                                <div className="dash-note-actions" style={{ opacity: 1 }}>
                                  <button
                                    type="button"
                                    className="dash-btn dash-btn-ghost dash-note-nav"
                                    onClick={() =>
                                      setEditWeekly({
                                        id: w.id,
                                        title: w.title,
                                        body: w.body,
                                        question: w.question ?? "",
                                        memoryVerse: w.memoryVerse ?? "",
                                      })
                                    }
                                  >
                                    Edit
                                  </button>
                                  <span className="flex-1" />
                                  <button type="button" className="dash-word-link" onClick={() => takeDown(w)}>
                                    Take down
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </Panel>

          <div className="mt-[18px]">
            <Panel
              eyebrow={unread ? `${unread} new` : "Private to you"}
              title="Check-in replies"
              action={
                unread > 0 && (
                  <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => markRead("all")}>
                    Mark all read
                  </button>
                )
              }
            >
              {replies.length === 0 && <p className="dash-word-hint">No replies yet.</p>}
              <div className="flex flex-col gap-2">
                {replies.map((r) => (
                  <div key={r.id} className={`dash-mod-card ${r.read ? "" : "is-new"}`}>
                    <div className="dash-mod-meta">
                      <strong>{r.member}</strong>
                      <span>{r.email}</span>
                      <span>{when(r.createdAt)}</span>
                      <span>re: {titleOf(r.reflectionId)}</span>
                    </div>
                    <div className="dash-mod-text">
                      <NoteText text={r.text} />
                    </div>
                    <div className="flex gap-3 mt-2">
                      {r.email && (
                        <a className="dash-word-link" href={`mailto:${r.email}?subject=${encodeURIComponent(`Re: ${titleOf(r.reflectionId)}`)}`}>
                          Reply by email
                        </a>
                      )}
                      {!r.read && (
                        <button type="button" className="dash-word-link" onClick={() => markRead(r.id)}>
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
