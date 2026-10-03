"use client";

// The owner's side of The Study's community: answer members' questions (and
// choose which answers to share as Q&A), approve or decline testimonies
// (nothing appears until approved), see reported posts, post the weekly
// reflection and read members' private check-in replies.

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
  const [answers, setAnswers] = useState<Record<string, { text: string; publish: boolean }>>({});
  const [showAnswered, setShowAnswered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", body: "", question: "How are you doing this week - what's God been showing you?" });
  const [posting, setPosting] = useState(false);
  const [showShared, setShowShared] = useState(false);

  function load() {
    api<{ posts: Post[]; weekly: Weekly[]; replies: Reply[]; questions: Question[] }>("GET")
      .then((d) => {
        setQuestions(d.questions);
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
      setDraft({ title: "", body: "", question: draft.question });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't post that.");
    } finally {
      setPosting(false);
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
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: { text: e.target.value, publish: a[q.id]?.publish ?? false } }))}
                  />
                  <label className="dash-day-share mt-2">
                    <input
                      type="checkbox"
                      checked={answers[q.id]?.publish ?? false}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: { text: a[q.id]?.text ?? "", publish: e.target.checked } }))}
                    />
                    Also share as a Q&amp;A with all members (the asker isn&apos;t named)
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
                        {q.published ? "Stop sharing as Q&A" : "Share as Q&A with members"}
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
                <div className="eyebrow">Posted</div>
                {weekly.map((w, i) => (
                  <div key={w.id} className="dash-members-row">
                    <div className="min-w-0">
                      <div className="dash-members-name">
                        {w.title} {i === 0 && <span className="dash-word-hint">· showing now</span>}
                      </div>
                      <div className="dash-word-hint">
                        {when(w.publishedAt)} · {w.replies} {w.replies === 1 ? "reply" : "replies"}
                      </div>
                    </div>
                    <button type="button" className="dash-word-link" onClick={() => takeDown(w)}>
                      Take down
                    </button>
                  </div>
                ))}
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
