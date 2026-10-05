"use client";

// Community - members only, and kept safe: this week's reflection from the
// owner with a private check-in reply; questions asked privately and
// answered only by the owner or the helpers they choose (members can't
// comment on anything), with chosen answers shared as Q&A; and testimonies,
// each approved by the owner first.

import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { GrowingTextarea } from "@/components/dashboard/growing-textarea";
import { NoteText } from "@/components/dashboard/note-text";
import { MemberOnly, useMe } from "@/components/study/shell";
import { ReflectionBody } from "@/components/study/reflection";

interface Post {
  id: string;
  kind: string;
  author: string;
  day: string | null;
  ref: string | null;
  title: string | null;
  text: string;
  status?: string;
  mine: boolean;
  createdAt: number;
}
interface Question {
  id: string;
  text: string;
  ref: string | null;
  status?: string;
  answer: string | null;
  answeredBy: string | null;
  answeredAt: number | null;
  published?: boolean;
  createdAt?: number;
  askerName?: string;
}
interface Weekly {
  memoryVerse?: string | null;
  id: string;
  title: string;
  body: string;
  question: string | null;
  publishedAt: number;
}

const shortDate = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
// Earlier weeks grouped by month, newest first: [["September 2026", [...]], …]
function pastByMonth(list: Weekly[]): [string, Weekly[]][] {
  const groups = new Map<string, Weekly[]>();
  for (const r of list) {
    const label = new Date(r.publishedAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    groups.set(label, [...(groups.get(label) ?? []), r]);
  }
  return [...groups.entries()];
}
const when = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const STATUS: Record<string, string> = {
  pending: "Waiting for approval",
  approved: "Shared with members",
  declined: "Not shared",
};

function Community() {
  const me = useMe();
  const author = me.study?.author && me.study.author !== "All The Glory" ? me.study.author : "The study's host";
  const [weekly, setWeekly] = useState<Weekly | null | undefined>(undefined);
  const [past, setPast] = useState<Weekly[]>([]);
  const [writer, setWriter] = useState<string | null>(null);
  // This week's reflection can be folded away (remembered on this device);
  // earlier weeks open one at a time.
  const foldKey = me.member ? `atg:study:${me.member.id}:weekFolded` : "";
  const [weekOpen, setWeekOpen] = useState(true);
  useEffect(() => {
    if (!foldKey) return;
    try {
      setWeekOpen(window.localStorage.getItem(foldKey) !== "1");
    } catch {
      // private window
    }
  }, [foldKey]);
  const toggleWeek = () =>
    setWeekOpen((open) => {
      try {
        window.localStorage.setItem(foldKey, open ? "1" : "0");
      } catch {
        // private window
      }
      return !open;
    });
  const [openPast, setOpenPast] = useState<string | null>(null);
  const [replies, setReplies] = useState<{ id: string; text: string; createdAt: number }[]>([]);
  const [reply, setReply] = useState("");
  const [replyState, setReplyState] = useState<string | null>(null);
  const [testimonies, setTestimonies] = useState<Post[]>([]);
  const [mine, setMine] = useState<Post[]>([]);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [writing, setWriting] = useState(false);
  const [form, setForm] = useState({ title: "", text: "", anonymous: false, consent: false });
  const [formState, setFormState] = useState<{ busy?: boolean; error?: string; done?: boolean }>({});
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [qa, setQa] = useState<Question[]>([]);
  const [queue, setQueue] = useState<Question[] | null>(null);
  const [ask, setAsk] = useState({ text: "", ref: "" });
  const [askState, setAskState] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, { text: string; publish: boolean }>>({});

  function loadQuestions() {
    fetch("/api/study/questions", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { mine?: Question[]; published?: Question[]; queue?: Question[] } | null) => {
        setMyQuestions(d?.mine ?? []);
        // Seen now - the home page stops pointing to them.
        try {
          const key = `atg:study:${me.member?.id}:seenAnswers`;
          const seen = new Set(JSON.parse(window.localStorage.getItem(key) ?? "[]") as string[]);
          for (const q of d?.mine ?? []) if (q.status === "answered") seen.add(q.id);
          window.localStorage.setItem(key, JSON.stringify([...seen]));
        } catch {
          // private window
        }
        setQa(d?.published ?? []);
        setQueue(d?.queue ?? null);
      })
      .catch(() => {});
  }

  async function sendQuestion() {
    if (ask.text.trim().length < 5) return;
    setAskState("Sending…");
    const r = await fetch("/api/study/questions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(ask),
    }).catch(() => null);
    const d = r ? ((await r.json().catch(() => ({}))) as { question?: Question; error?: string }) : null;
    if (r?.ok && d?.question) {
      setMyQuestions((list) => [d.question!, ...list]);
      setAsk({ text: "", ref: "" });
      setAskState(`✓ Sent. ${author} will answer you here.`);
    } else setAskState(d?.error ?? "Couldn't send - check your connection.");
  }

  async function withdrawQuestion(q: Question) {
    if (!confirm("Remove this question?")) return;
    await fetch(`/api/study/questions?id=${encodeURIComponent(q.id)}`, { method: "DELETE" }).catch(() => {});
    setMyQuestions((list) => list.filter((x) => x.id !== q.id));
  }

  async function answer(q: Question) {
    const a = answers[q.id];
    if (!a?.text.trim()) return;
    const r = await fetch("/api/study/questions", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: q.id, answer: a.text, publish: a.publish }),
    }).catch(() => null);
    if (r?.ok) {
      setQueue((list) => list?.filter((x) => x.id !== q.id) ?? null);
      loadQuestions();
    } else alert("Couldn't save the answer - try again.");
  }

  useEffect(() => {
    fetch("/api/study/weekly", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { reflection?: Weekly | null; replies?: typeof replies; past?: Weekly[]; author?: string | null } | null) => {
        setWeekly(d?.reflection ?? null);
        setReplies(d?.replies ?? []);
        setPast(d?.past ?? []);
        setWriter(d?.author ?? null);
      })
      .catch(() => setWeekly(null));
    fetch("/api/study/community?kind=testimony", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { posts?: Post[] } | null) => setTestimonies(d?.posts ?? []))
      .catch(() => {});
    fetch("/api/study/community?mine=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { posts?: Post[] } | null) => setMine((d?.posts ?? []).filter((p) => p.kind === "testimony")))
      .catch(() => {});
    loadQuestions();
  }, []);

  async function sendReply() {
    if (!weekly || !reply.trim()) return;
    setReplyState("Sending…");
    const r = await fetch("/api/study/weekly", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reflectionId: weekly.id, text: reply }),
    }).catch(() => null);
    const d = r ? ((await r.json().catch(() => ({}))) as { reply?: (typeof replies)[number]; error?: string }) : null;
    if (r?.ok && d?.reply) {
      setReplies((list) => [...list, d.reply!]);
      setReply("");
      setReplyState(`✓ Sent - only ${author} reads this.`);
    } else setReplyState(d?.error ?? "Couldn't send - check your connection.");
  }

  async function shareTestimony() {
    if (!form.consent) return;
    setFormState({ busy: true });
    const r = await fetch("/api/study/community", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "testimony", title: form.title, text: form.text, anonymous: form.anonymous, consent: true }),
    }).catch(() => null);
    const d = r ? ((await r.json().catch(() => ({}))) as { post?: Post; error?: string }) : null;
    if (r?.ok && d?.post) {
      setMine((list) => [d.post!, ...list]);
      setForm({ title: "", text: "", anonymous: false, consent: false });
      setFormState({ done: true });
      setWriting(false);
    } else setFormState({ error: d?.error ?? "Couldn't send - check your connection." });
  }

  async function withdraw(post: Post) {
    if (!confirm("Stop sharing this? It's removed for everyone straight away.")) return;
    await fetch(`/api/study/community?id=${encodeURIComponent(post.id)}`, { method: "DELETE" }).catch(() => {});
    setMine((list) => list.filter((p) => p.id !== post.id));
    setTestimonies((list) => list.filter((p) => p.id !== post.id));
  }

  async function report(post: Post) {
    const reason = prompt(`What's wrong with this post? (${author} will look at it.)`, "");
    if (reason === null) return;
    await fetch("/api/study/community", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ report: post.id, reason }),
    }).catch(() => {});
    alert("Thank you - it's been passed on.");
  }

  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">The Study · members only</div>
          <h1 className="dash-title mt-1">Community</h1>
          <div className="dash-subtitle">
            A weekly word from {author}, your questions answered, and what God is doing in members&apos; lives. Members only -
            and nothing appears until {author} has read it.
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col-7">
          <Panel
            eyebrow={weekly ? `This week · ${when(weekly.publishedAt)} · from ${writer ?? author}` : "This week"}
            title={weekly?.title ?? "This week's reflection"}
            action={
              weekly ? (
                <button type="button" className="dash-daniel-toggle dash-fold-btn" onClick={toggleWeek} aria-expanded={weekOpen}>
                  {weekOpen ? "Minimise ▴" : "Open ▾"}
                </button>
              ) : undefined
            }
          >
            {weekly === undefined && <p className="dash-word-hint">Opening…</p>}
            {weekly === null && <p className="dash-word-hint">{author} hasn&apos;t posted this week&apos;s reflection yet.</p>}
            {weekly && !weekOpen && (
              <button type="button" className="dash-reflection-folded" onClick={toggleWeek}>
                <span>{weekly.body.replace(/\s+/g, " ").slice(0, 140)}…</span>
                <span className="dash-word-link">Read it →</span>
              </button>
            )}
            {weekly && weekOpen && (
              <>
                <ReflectionBody r={weekly} author={writer ?? author} current />
                {weekly.question && (
                  <div className="dash-checkin">
                    <div className="eyebrow eyebrow-amber">Check-in</div>
                    <p className="dash-checkin-q">{weekly.question}</p>
                    {replies.map((r) => (
                      <div key={r.id} className="dash-checkin-mine">
                        <span>You · {when(r.createdAt)}</span>
                        <NoteText text={r.text} />
                      </div>
                    ))}
                    <GrowingTextarea
                      className="dash-textarea dash-word-field"
                      placeholder={`Reply to ${author} - only ${author} sees this.`}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                    />
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <button type="button" className="dash-btn dash-btn-primary" disabled={!reply.trim()} onClick={sendReply}>
                        Send privately
                      </button>
                      {replyState && <span className="dash-word-hint">{replyState}</span>}
                    </div>
                  </div>
                )}
              </>
            )}
          </Panel>

          {past.length > 0 && (
            <div className="mt-[18px]">
              <Panel eyebrow={`From ${writer ?? author} · ${past.length}`} title="Earlier weeks">
                {pastByMonth(past).map(([month, list]) => (
                  <div key={month} className="dash-weeks-month">
                    <div className="dash-note-section-label">{month}</div>
                    <div className="dash-note-list">
                      {list.map((r) => {
                        const isOpen = openPast === r.id;
                        return (
                          <article key={r.id} className={`dash-note ${isOpen ? "is-open" : ""}`}>
                            <button
                              type="button"
                              className="dash-note-head"
                              onClick={() => setOpenPast(isOpen ? null : r.id)}
                              aria-expanded={isOpen}
                            >
                              <span className="dash-note-head-ref">{shortDate(r.publishedAt)}</span>
                              <span className="dash-note-head-text">{r.title}</span>
                              <span className="dash-note-chev" aria-hidden>
                                ›
                              </span>
                            </button>
                            {isOpen && (
                              <div className="dash-note-open">
                                <h3 className="dash-reflection-title">{r.title}</h3>
                                <ReflectionBody r={r} author={writer ?? author} />
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </Panel>
            </div>
          )}

          <div className="mt-[18px] scroll-mt-6" id="questions">
            <Panel eyebrow="Ask" title="Ask a question">
              <p className="dash-word-hint mb-3">
                Ask about a passage, a word, or something you&apos;re working through. Your question goes privately to{" "}
                {author}
                {" "}or one of the trusted helpers, and the answer comes back here. Answers are shared so everyone
                can learn - your name is never shown.
              </p>
              <GrowingTextarea
                className="dash-textarea dash-word-field"
                placeholder="Your question…"
                value={ask.text}
                onChange={(e) => setAsk({ ...ask, text: e.target.value })}
              />
              <div className="flex gap-2 mt-2 flex-wrap items-center">
                <input
                  className="dash-input dash-ask-ref"
                  placeholder="Passage (optional), e.g. John 4:10"
                  value={ask.ref}
                  onChange={(e) => setAsk({ ...ask, ref: e.target.value })}
                />
                <button type="button" className="dash-btn dash-btn-primary" disabled={ask.text.trim().length < 5} onClick={sendQuestion}>
                  Ask privately
                </button>
              </div>
              {askState && <p className="dash-word-hint mt-2">{askState}</p>}

              {myQuestions.length > 0 && (
                <div className="dash-fold">
                  <div className="dash-note-section-row">
                    <span className="eyebrow eyebrow-amber">Your questions · {myQuestions.length}</span>
                  </div>
                  <div className="dash-note-list">
                    {myQuestions.map((q) => (
                      <article key={q.id} className="dash-note is-open">
                        <div className="dash-reflection-head">
                          <span className="dash-note-head-ref">{q.ref || "Question"}</span>
                          <span className="dash-reflection-who">
                            {q.status === "answered" ? `Answered by ${q.answeredBy ?? author}` : "Waiting for an answer"}
                          </span>
                        </div>
                        <div className="dash-note-open">
                          <p className="dash-question">{q.text}</p>
                          {q.answer && (
                            <div className="dash-answer">
                              <NoteText text={q.answer} />
                            </div>
                          )}
                          {q.status !== "answered" && (
                            <div className="dash-note-actions">
                              <span className="flex-1" />
                              <button type="button" className="dash-word-link" onClick={() => withdrawQuestion(q)}>
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          </div>

          {qa.length > 0 && (
            <div className="mt-[18px]">
              <Panel eyebrow={`Answered by ${author}`} title="Questions & answers">
                <div className="dash-note-list">
                  {qa.map((q) => {
                    const isOpen = open.has(q.id);
                    return (
                      <article key={q.id} className={`dash-note ${isOpen ? "is-open" : ""}`}>
                        <button type="button" className="dash-note-head" onClick={() => toggle(q.id)} aria-expanded={isOpen}>
                          <span className="dash-note-head-ref">{q.ref || "Question"}</span>
                          <span className="dash-note-head-text">{q.text}</span>
                          <span className="dash-note-chev" aria-hidden>
                            ›
                          </span>
                        </button>
                        {isOpen && (
                          <div className="dash-note-open">
                            <p className="dash-question">{q.text}</p>
                            <div className="dash-answer">
                              <NoteText text={q.answer ?? ""} />
                              <span className="dash-reflection-who">- {q.answeredBy ?? author}</span>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </Panel>
            </div>
          )}

          <div className="mt-[18px]">
            <Panel
              eyebrow="Shared by members"
              title="Testimonies"
              action={
                !writing && (
                  <button type="button" className="dash-btn dash-btn-primary dash-note-nav" onClick={() => setWriting(true)}>
                    Share yours
                  </button>
                )
              }
            >
              {formState.done && (
                <div className="dash-word-saved">✓ Thank you. {author} will read it and it will appear here once approved.</div>
              )}
              {writing && (
                <div className="dash-share-form mb-4">
                  <p>
                    Share what God has done in your life. Keep it about your own story - please don&apos;t name other
                    people or share their details without their permission, and leave out medical or legal advice.{" "}
                    {author} reads every testimony before it appears, and only signed-in members can see it - never the
                    public site. You can remove it any time.
                  </p>
                  <input
                    className="dash-input"
                    placeholder="A title (optional), e.g. Found again"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                  <GrowingTextarea
                    className="dash-textarea dash-word-field"
                    minRows={6}
                    placeholder="Your testimony…"
                    value={form.text}
                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                  />
                  <label className="dash-day-share">
                    <input type="checkbox" checked={form.anonymous} onChange={(e) => setForm({ ...form, anonymous: e.target.checked })} />
                    Share without my name (shows as &ldquo;A member&rdquo;)
                  </label>
                  <label className="dash-day-share">
                    <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
                    I&apos;m happy for other members of The Study to read this
                  </label>
                  {formState.error && <p className="text-[12.5px] text-[#f1a07d]">{formState.error}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="dash-btn dash-btn-primary"
                      disabled={!form.consent || form.text.trim().length < 20 || formState.busy}
                      onClick={shareTestimony}
                    >
                      {formState.busy ? "Sending…" : "Send for approval"}
                    </button>
                    <button type="button" className="dash-btn dash-btn-ghost" onClick={() => setWriting(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {testimonies.length === 0 && !writing && (
                <p className="dash-word-hint">No testimonies yet - yours could be the first.</p>
              )}
              <div className="dash-note-list">
                {testimonies.map((t) => {
                  const isOpen = open.has(t.id);
                  return (
                    <article key={t.id} className={`dash-note ${isOpen ? "is-open" : ""}`}>
                      <button type="button" className="dash-note-head dash-testimony-head" onClick={() => toggle(t.id)} aria-expanded={isOpen}>
                        <span className="dash-testimony-title">{t.title || "Testimony"}</span>
                        <span className="dash-note-head-text">{isOpen ? "" : `${t.mine ? "You" : t.author} · ${t.text.replace(/\s+/g, " ")}`}</span>
                        <span className="dash-note-chev" aria-hidden>
                          ›
                        </span>
                      </button>
                      {isOpen && (
                        <div className="dash-note-open">
                          <div className="dash-reflection-who mb-2">
                            {t.mine ? "You" : t.author} · {when(t.createdAt)}
                          </div>
                          <NoteText text={t.text} />
                          <div className="dash-note-actions">
                            <span className="flex-1" />
                            {t.mine ? (
                              <button type="button" className="dash-word-link" onClick={() => withdraw(t)}>
                                Remove
                              </button>
                            ) : (
                              <button type="button" className="dash-word-link" onClick={() => report(t)}>
                                Report
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </Panel>
          </div>
        </div>

        <div className="dash-col-5">
          {queue && (
            <div className="mb-[18px]">
              <Panel eyebrow="You're a helper" title={`Questions to answer · ${queue.length}`}>
                {queue.length === 0 && <p className="dash-word-hint">No questions waiting.</p>}
                <div className="flex flex-col gap-3">
                  {queue.map((q) => (
                    <div key={q.id} className="dash-mod-card">
                      <div className="dash-mod-meta">
                        <strong>{q.askerName}</strong>
                        {q.ref && <span>{q.ref}</span>}
                        {q.createdAt && <span>{when(q.createdAt)}</span>}
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
                          onChange={(e) =>
                            setAnswers((a) => ({ ...a, [q.id]: { text: a[q.id]?.text ?? "", publish: e.target.checked } }))
                          }
                        />
                        Share the question and answer for everyone (the asker is never named) - untick if it&apos;s personal
                      </label>
                      <button
                        type="button"
                        className="dash-btn dash-btn-primary dash-note-nav mt-2"
                        disabled={!answers[q.id]?.text.trim()}
                        onClick={() => answer(q)}
                      >
                        Send answer
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}
          <Panel eyebrow="Yours" title="Your testimonies">
            {mine.length === 0 && (
              <p className="dash-word-hint">
                Nothing yet. Tap &ldquo;Share yours&rdquo; under Testimonies to tell what God has done.
              </p>
            )}
            <div className="flex flex-col gap-2">
              {mine.map((p) => (
                <div key={p.id} className="dash-members-row">
                  <div className="min-w-0">
                    <div className="dash-members-name">
                      {p.title || "Testimony"}
                    </div>
                    <div className="dash-word-hint">
                      {STATUS[p.status ?? "pending"]} · {p.author === "A member" ? "without your name" : "with your first name"}
                    </div>
                  </div>
                  <button type="button" className="dash-word-link" onClick={() => withdraw(p)}>
                    {p.status === "declined" ? "Remove" : "Stop sharing"}
                  </button>
                </div>
              ))}
            </div>
          </Panel>
          <div className="mt-[18px]">
            <Panel eyebrow="How this works" title="Safe and sound">
              <ul className="dash-community-rules">
                <li>Your journal is private. Notes are never shared - only testimonies you choose to send.</li>
                <li>
                  Questions go privately to {author}. Only {author} and trusted helpers answer them - members
                  can&apos;t comment on anything, so what&apos;s taught here stays true to the Word.
                </li>
                <li>Answers are shared as Q&amp;A so everyone can learn - the person who asked is never named.</li>
                <li>{author} reads every testimony first. Nothing appears until it&apos;s approved, and you choose your first name or anonymous.</li>
                <li>Only signed-in members see any of this - never the public website or search engines.</li>
                <li>Check-in replies are private to {author}. See something that isn&apos;t right? Tap Report.</li>
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CommunityPage() {
  return (
    <MemberOnly>
      <Community />
    </MemberOnly>
  );
}
