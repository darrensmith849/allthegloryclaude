"use client";

// The Study, on the main site: what it is, Daniel's heart for it, a few
// questions he has answered, and joining / logging in right here. Members
// then use the study itself at /study.

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { PLAN, STUDY_HEART } from "@/lib/study/plan";

interface Me {
  member: { name: string } | null;
  study: { signup: "invite" | "open" | "closed"; author: string; intro: string };
}
interface QA {
  id: string;
  text: string;
  ref: string | null;
  answer: string;
  answeredBy: string | null;
}


// Only paths inside The Study (or, for Daniel's team, the dashboard) are
// followed after logging in.
const safeNext = (raw: string | null) =>
  raw && (raw.startsWith("/study") || raw.startsWith("/dashboard/")) && !raw.startsWith("//") ? raw : "/study";

const input =
  "w-full bg-colour-surface border border-colour-fg/10 rounded px-4 py-3 text-base text-colour-fg placeholder:text-colour-fg/30 focus:outline-none focus:border-colour-accent transition-colors";
const label = "block text-sm font-medium text-colour-fg/70 mb-2";

const FEATURES = [
  {
    title: "Read it in the order it happened",
    text: `${PLAN.name} (NIV) takes you through the whole Bible in 365 daily readings - books, chapters and even verses in the order events happened. Read free in the Bible App, or in the book.`,
  },
  {
    title: "Keep your own journal",
    text: "A calendar of your notes, day by day - private to you and kept for good, so you can look back on what God showed you, year after year.",
  },
  {
    title: "Go deeper into the words",
    text: "Look up any word from the day's reading and see the Hebrew or Greek behind it, what it means, and the verses that use it.",
  },
  {
    title: "Ask, and learn together",
    text: "Ask your questions privately. Daniel or a trusted helper answers, and answers are shared so everyone can learn - your name is never shown.",
  },
];

export default function TheStudyPage() {
  const reduce = useReducedMotion();
  const [me, setMe] = useState<Me | null>(null);
  const [qa, setQa] = useState<QA[]>([]);
  const [tab, setTab] = useState<"join" | "login" | "forgot" | "reset">("join");
  const [resetToken, setResetToken] = useState("");
  const [sent, setSent] = useState(false);
  const [invite, setInvite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("login")) setTab("login");
    if (q.get("reset")) {
      setTab("reset");
      setResetToken(q.get("reset") ?? "");
    }
    setInvite(q.get("invite") ?? "");
    if (q.get("login") || q.get("invite") || q.get("reset") || window.location.hash === "#join") {
      window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
    fetch("/api/study/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Me | null) => {
        if (!d) return;
        // Already logged in and sent here to log in: go straight on.
        if (d.member && q.get("login") && !q.get("reset")) {
          window.location.replace(safeNext(q.get("next")));
          return;
        }
        setMe(d);
      })
      .catch(() => {});
    fetch("/api/study/qa", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { questions?: QA[] } | null) => setQa(d?.questions ?? []))
      .catch(() => {});
  }, []);

  const author = me?.study.author && me.study.author !== "All The Glory" ? me.study.author : "Daniel";
  const heart = me?.study.intro || STUDY_HEART;
  const canJoin = me?.study.signup === "open" || (me?.study.signup === "invite" && Boolean(invite));

  function open(which: "join" | "login") {
    setTab(which);
    setError(null);
    formRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    if (String(f.get("website") ?? "")) return; // bots
    setBusy(true);
    setError(null);
    if (tab === "forgot") {
      const r = await fetch("/api/study/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: f.get("email") }),
      }).catch(() => null);
      const d = r ? ((await r.json().catch(() => ({}))) as { error?: string }) : null;
      setBusy(false);
      if (r?.ok) setSent(true);
      else setError(d?.error ?? "Couldn't send - check your connection.");
      return;
    }
    if (tab === "reset") {
      const password = String(f.get("password") ?? "");
      if (password.length < 8) {
        setError("Use a password of at least 8 characters.");
        setBusy(false);
        return;
      }
      const r = await fetch("/api/study/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: resetToken, password }),
      }).catch(() => null);
      const d = r ? ((await r.json().catch(() => ({}))) as { error?: string }) : null;
      if (r?.ok) {
        try {
          window.sessionStorage.removeItem("atg:study:me");
        } catch {
          // private window
        }
        window.location.assign("/study");
      } else {
        setError(d?.error ?? "Couldn't set your password - try again.");
        setBusy(false);
      }
      return;
    }
    const body =
      tab === "join"
        ? {
            name: f.get("name"),
            email: f.get("email"),
            password: f.get("password"),
            emailUpdates: f.get("updates") === "on",
            invite,
          }
        : { email: f.get("email"), password: f.get("password"), invite };
    try {
      const r = await fetch(tab === "join" ? "/api/study/join" : "/api/study/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string; team?: boolean };
      if (!r.ok) throw new Error(data.error ?? "Something went wrong - try again.");
      try {
        window.sessionStorage.removeItem("atg:study:me");
      } catch {
        // private window
      }
      // Daniel's team invite: straight to the team dashboard.
      if (data.team) window.location.assign("/dashboard/community");
      else window.location.assign(tab === "join" ? "/study/journal" : safeNext(new URLSearchParams(window.location.search).get("next")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong - try again.");
      setBusy(false);
    }
  }

  const fade = (delay: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.01 } }
      : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] as const } };

  return (
    <main className="bg-transparent overflow-x-clip pt-24">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="w-full pt-16 md:pt-24 pb-10">
        <motion.div {...fade(0.05)} className="max-w-3xl mx-auto px-6 text-center">
          <div className="relative mx-auto mb-6 w-[clamp(130px,18vw,180px)] aspect-square">
            <div
              aria-hidden="true"
              className="absolute inset-0 -m-10 rounded-full blur-3xl opacity-55"
              style={{
                background:
                  "radial-gradient(50% 50% at 50% 55%, rgba(216,178,90,0.55), rgba(216,178,90,0.12) 55%, transparent 75%)",
              }}
            />
            <Image src="/media/logo-dove.png" alt="" fill priority sizes="180px" className="relative object-contain" />
          </div>
          <div className="eyebrow eyebrow-amber mb-4">The Study</div>
          <h1 className="font-display text-4xl md:text-6xl font-normal text-white tracking-tight mb-5">
            Read through the Bible in the order it happened.
          </h1>
          <p className="text-base md:text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
            A free daily Bible study from All The Glory - one day at a time, with a journal of your own, the Hebrew and
            Greek behind the words, and {author}&apos;s notes to read alongside.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {me?.member ? (
              <a
                href="/study"
                className="px-7 py-3 bg-colour-accent text-colour-bg font-semibold text-sm uppercase tracking-widest hover:bg-colour-fg transition-colors"
              >
                Open my study →
              </a>
            ) : (
              <>
                {(me?.study.signup ?? "open") !== "closed" && (
                  <button
                    type="button"
                    onClick={() => open("join")}
                    className="px-7 py-3 bg-colour-accent text-colour-bg font-semibold text-sm uppercase tracking-widest hover:bg-colour-fg transition-colors"
                  >
                    Join The Study
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => open("login")}
                  className="px-7 py-3 border border-white/25 text-white/85 font-semibold text-sm uppercase tracking-widest hover:border-white/60 hover:text-white transition-colors"
                >
                  Log in
                </button>
              </>
            )}
          </div>
          {me?.member && <p className="mt-4 text-sm text-white/55">Welcome back, {me.member.name.split(" ")[0]}.</p>}
        </motion.div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="w-full py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid gap-4 md:grid-cols-2">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} {...fade(0.15 + i * 0.08)} className="panel-scrim p-6 md:p-7">
                <div className="eyebrow eyebrow-amber mb-3">0{i + 1}</div>
                <h2 className="font-display text-2xl text-white mb-3">{f.title}</h2>
                <p className="text-sm md:text-[15px] text-white/70 leading-relaxed">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Daniel's study ───────────────────────────────────── */}
      <section className="w-full py-10 md:py-14">
        <motion.div {...fade(0.2)} className="max-w-3xl mx-auto px-6 text-center">
          <div className="eyebrow eyebrow-amber mb-4">{author}&apos;s study</div>
          <p className="font-display text-[22px] md:text-[32px] leading-relaxed md:leading-snug text-white/90 italic">&ldquo;{heart}&rdquo;</p>
          <p className="mt-5 text-sm text-white/55">
            Read {author}&apos;s notes and word studies for every day of the reading plan once you&apos;ve joined.
          </p>
        </motion.div>
      </section>

      {/* ── Questions & answers (public; askers never named) ─── */}
      {qa.length > 0 && (
        <section className="w-full py-10 md:py-14">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-8">
              <div className="eyebrow eyebrow-amber mb-3">Questions &amp; answers</div>
              <h2 className="font-display text-3xl md:text-4xl text-white">Asked by members, answered by {author}</h2>
            </div>
            <div className="flex flex-col gap-3">
              {qa.slice(0, 6).map((q) => (
                <details key={q.id} className="panel-scrim px-6 py-4 group">
                  <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                    <span>
                      {q.ref && <span className="block eyebrow eyebrow-amber mb-1">{q.ref}</span>}
                      <span className="font-display text-lg md:text-xl text-white">{q.text}</span>
                    </span>
                    <span className="text-white/40 transition-transform group-open:rotate-90">›</span>
                  </summary>
                  <div className="mt-4 pl-4 border-l-2 border-[var(--colour-amber)] text-white/75 leading-relaxed whitespace-pre-line">
                    {q.answer}
                    <span className="block mt-2 text-sm text-white/45">- {q.answeredBy ?? author}</span>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Join / log in ────────────────────────────────────── */}
      {(!me?.member || tab === "reset") && (
        <section className="w-full py-10 md:py-16 scroll-mt-28" id="join" ref={formRef}>
          <div className="max-w-md mx-auto px-6">
            <div className="panel-scrim p-6 md:p-8">
              {tab === "forgot" || tab === "reset" ? (
                <div className="mb-6">
                  <div className="eyebrow eyebrow-amber mb-2">{tab === "forgot" ? "Forgotten your password?" : "New password"}</div>
                  <p className="text-sm text-white/65 leading-relaxed">
                    {tab === "forgot"
                      ? "Type the email you joined with and we'll send you a link to choose a new password."
                      : "Choose a new password for your journal. You'll be logged out everywhere else."}
                  </p>
                </div>
              ) : (
              <div className="flex gap-2 mb-6" role="tablist">
                {(["join", "login"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => {
                      setTab(t);
                      setError(null);
                    }}
                    className={`flex-1 py-2 text-xs uppercase tracking-widest border-b transition-colors ${
                      tab === t ? "border-[var(--colour-amber)] text-white" : "border-white/10 text-white/45 hover:text-white/75"
                    }`}
                  >
                    {t === "join" ? "Join" : "Log in"}
                  </button>
                ))}
              </div>
              )}

              {tab === "forgot" && sent ? (
                <div className="text-sm text-white/75 leading-relaxed">
                  <p>
                    ✓ If there&apos;s an account with that email, a link is on its way. It works for the next hour - check
                    your spam folder if you don&apos;t see it.
                  </p>
                  <button
                    type="button"
                    className="mt-4 underline text-white/60 hover:text-white"
                    onClick={() => {
                      setTab("login");
                      setSent(false);
                    }}
                  >
                    Back to log in
                  </button>
                </div>
              ) : tab === "join" && !canJoin ? (
                <p className="text-sm text-white/65 leading-relaxed">
                  {me?.study.signup === "closed"
                    ? "Joining is closed for now - please check back soon."
                    : "Joining is by invitation for now. If you've been sent a link, open it to make your account."}
                </p>
              ) : (
                <form onSubmit={submit} className="space-y-5" noValidate>
                  <div className="absolute opacity-0 h-0 w-0 overflow-hidden -z-10">
                    <label htmlFor="ts-website">Website</label>
                    <input type="text" name="website" id="ts-website" tabIndex={-1} autoComplete="off" />
                  </div>
                  {tab === "join" && (
                    <div>
                      <label htmlFor="ts-name" className={label}>
                        Your name
                      </label>
                      <input id="ts-name" name="name" autoComplete="name" required className={input} placeholder="Your name" />
                    </div>
                  )}
                  {tab !== "reset" && (
                  <div>
                    <label htmlFor="ts-email" className={label}>
                      Email
                    </label>
                    <input id="ts-email" name="email" type="email" autoComplete="email" required className={input} placeholder="you@example.com" />
                  </div>
                  )}
                  {tab !== "forgot" && (
                  <div>
                    <label htmlFor="ts-password" className={label}>
                      {tab === "reset" ? "New password" : "Password"}
                    </label>
                    <input
                      id="ts-password"
                      name="password"
                      type="password"
                      autoComplete={tab === "login" ? "current-password" : "new-password"}
                      minLength={tab === "login" ? undefined : 8}
                      required
                      className={input}
                      placeholder={tab === "login" ? "Your password" : "At least 8 characters"}
                    />
                  </div>
                  )}
                  {tab === "join" && (
                    <label className="flex items-start gap-3 text-sm text-white/65 leading-relaxed">
                      <input type="checkbox" name="updates" className="mt-1 accent-[var(--colour-amber)]" />
                      Email me now and then about new studies, music and videos from All The Glory. Unsubscribe any time.
                    </label>
                  )}
                  {error && (
                    <p role="alert" className="text-sm text-red-400">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3 bg-colour-accent text-colour-bg font-semibold text-sm uppercase tracking-widest hover:bg-colour-fg transition-colors disabled:opacity-60"
                  >
                    {busy
                      ? "One moment…"
                      : tab === "join"
                        ? "Make my account"
                        : tab === "forgot"
                          ? "Email me a link"
                          : tab === "reset"
                            ? "Save and open my journal"
                            : "Log in"}
                  </button>
                  <p className="text-xs text-white/45 leading-relaxed">
                    {tab === "join" ? (
                      <>
                        Your journal is private to you. We keep only your name, email and what you write, and you can
                        download or delete it all any time. See our{" "}
                        <a href="/privacy" className="underline hover:text-white/70">
                          privacy policy
                        </a>
                        .
                      </>
                    ) : tab === "login" ? (
                      <button
                        type="button"
                        className="underline hover:text-white/70"
                        onClick={() => {
                          setTab("forgot");
                          setError(null);
                        }}
                      >
                        Forgotten your password?
                      </button>
                    ) : tab === "forgot" ? (
                      <button type="button" className="underline hover:text-white/70" onClick={() => setTab("login")}>
                        Back to log in
                      </button>
                    ) : (
                      "The link works once, for an hour. If it has run out, ask for a new one."
                    )}
                  </p>
                </form>
              )}
            </div>
            <p className="mt-6 text-center text-xs text-white/40">
              Readings follow{" "}
              <a href={PLAN.bibleApp} target="_blank" rel="noreferrer" className="underline hover:text-white/70">
                {PLAN.name} (NIV)
              </a>
              , free in the Bible App.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
