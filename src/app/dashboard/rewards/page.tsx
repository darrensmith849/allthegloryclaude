"use client";

import { Panel, Stat } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import { currentStreak, longestStreak, countInLastN } from "@/lib/dashboard/streaks";
import { todayISO } from "@/lib/dashboard/dates";

interface Milestone {
  id: string;
  title: string;
  blurb: string;
  points: number;
  progress: () => { current: number; target: number };
}

const POINTS = {
  bibleDay: 10,
  cleanDay: 8,
  taskDone: 4,
  workoutDay: 6,
  worshipDay: 5,
  guitarSession: 5,
  bookWords1k: 12,
};

export default function RewardsPage() {
  const { state, update, ready } = useDashboard();
  const today = todayISO();

  // Points: a clean, fair tally over all-time data.
  const bibleDays = Object.values(state.habits).filter((h) => h["bibleRead"]).length;
  const cleanDays = Object.values(state.habits).filter((h) => h["noPorn"]).length;
  const tasksDone = state.tasks.filter((t) => t.done).length;
  const workoutDays = Object.values(state.habits).filter((h) => h["gym"]).length;
  const worshipDays = Object.values(state.habits).filter((h) => h["worship"]).length;
  const guitarSessions = state.guitar.length;
  const bookWords = state.book.sessions.reduce((s, x) => s + (x.words || 0), 0);

  const points =
    bibleDays * POINTS.bibleDay +
    cleanDays * POINTS.cleanDay +
    tasksDone * POINTS.taskDone +
    workoutDays * POINTS.workoutDay +
    worshipDays * POINTS.worshipDay +
    guitarSessions * POINTS.guitarSession +
    Math.floor(bookWords / 1000) * POINTS.bookWords1k;

  const tier =
    points >= 5000 ? "Faithful Servant" :
    points >= 2500 ? "Steadfast" :
    points >= 1000 ? "Disciple" :
    points >= 400 ? "Apprentice" :
    points >= 100 ? "Seeking" : "Beginning";

  const cleanStreakNow = currentStreak(state, (h) => Boolean(h["noPorn"]));
  const bibleStreakNow = currentStreak(state, (h) => Boolean(h["bibleRead"]));
  const longestBible = longestStreak(state, (h) => Boolean(h["bibleRead"]));
  const longestClean = longestStreak(state, (h) => Boolean(h["noPorn"]));

  const milestones: Milestone[] = [
    {
      id: "bible-7",
      title: "A week in the Word",
      blurb: "Read your Bible 7 days running.",
      points: 50,
      progress: () => ({ current: bibleStreakNow, target: 7 }),
    },
    {
      id: "bible-30",
      title: "A month in the Word",
      blurb: "30-day Bible-reading streak.",
      points: 150,
      progress: () => ({ current: bibleStreakNow, target: 30 }),
    },
    {
      id: "bible-100",
      title: "Hundred days hidden in Christ",
      blurb: "100-day Bible-reading streak.",
      points: 500,
      progress: () => ({ current: bibleStreakNow, target: 100 }),
    },
    {
      id: "clean-7",
      title: "Eyes lifted up",
      blurb: "Seven clean days in a row.",
      points: 50,
      progress: () => ({ current: cleanStreakNow, target: 7 }),
    },
    {
      id: "clean-30",
      title: "A month of clean ground",
      blurb: "30 consecutive clean days.",
      points: 200,
      progress: () => ({ current: cleanStreakNow, target: 30 }),
    },
    {
      id: "clean-90",
      title: "Ninety days clean",
      blurb: "Three months. A new normal.",
      points: 600,
      progress: () => ({ current: cleanStreakNow, target: 90 }),
    },
    {
      id: "clean-365",
      title: "A clean year",
      blurb: "Three hundred and sixty-five clean days.",
      points: 2000,
      progress: () => ({ current: longestClean, target: 365 }),
    },
    {
      id: "plan-half",
      title: "Halfway through the year",
      blurb: "Reach Day 183 of the chronological plan.",
      points: 200,
      progress: () => ({
        current: countInLastN(state, 366, (h) => Boolean(h["bibleRead"])),
        target: 183,
      }),
    },
    {
      id: "guitar-30-sessions",
      title: "Thirty guitar reps",
      blurb: "Log 30 practice sessions.",
      points: 120,
      progress: () => ({ current: guitarSessions, target: 30 }),
    },
    {
      id: "book-5k",
      title: "Five thousand words down",
      blurb: "The first real milestone.",
      points: 200,
      progress: () => ({ current: bookWords, target: 5000 }),
    },
    {
      id: "book-25k",
      title: "Halfway to a manuscript",
      blurb: "25,000 words. A book is forming.",
      points: 800,
      progress: () => ({ current: bookWords, target: 25_000 }),
    },
    {
      id: "book-60k",
      title: "A manuscript",
      blurb: "60,000 words. The first complete draft.",
      points: 2000,
      progress: () => ({ current: bookWords, target: 60_000 }),
    },
    {
      id: "longest-bible-30",
      title: "Best streak - 30 days",
      blurb: "A 30-day Bible streak at any point.",
      points: 80,
      progress: () => ({ current: longestBible, target: 30 }),
    },
  ];

  function claim(id: string) {
    if (state.rewardsClaimed[id]) return;
    update((d) => {
      d.rewardsClaimed[id] = today;
    });
  }

  if (!ready) return null;

  const unlockedCount = milestones.filter((m) => {
    const p = m.progress();
    return p.current >= p.target;
  }).length;

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">{tier}</div>
          <h1 className="dash-title mt-1">Rewards &amp; Milestones</h1>
          <div className="dash-subtitle">
            The reward is the life you&apos;re building - these are the markers along the way.
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col-3">
          <Stat label="Glory points" value={points.toLocaleString()} hint={tier} />
        </div>
        <div className="dash-col-3">
          <Stat label="Milestones reached" value={`${unlockedCount}/${milestones.length}`} tone="ok" />
        </div>
        <div className="dash-col-3">
          <Stat label="Clean streak" value={`${cleanStreakNow} d`} tone="ok" />
        </div>
        <div className="dash-col-3">
          <Stat label="Word streak" value={`${bibleStreakNow} d`} />
        </div>

        <div className="dash-col-12">
          <Panel eyebrow="Targets" title="Milestones">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {milestones.map((m) => {
                const p = m.progress();
                const pct = Math.min(100, Math.round((p.current / p.target) * 100));
                const reached = p.current >= p.target;
                const claimed = state.rewardsClaimed[m.id];
                return (
                  <div key={m.id} className={`dash-reward ${reached ? "is-unlocked" : ""}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-display text-[17px] text-[var(--colour-ink-strong)]">
                          {m.title}
                        </div>
                        <div className="text-[12.5px] text-[var(--colour-ink-quiet)] mt-1">
                          {m.blurb}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="eyebrow eyebrow-amber">+{m.points}</div>
                      </div>
                    </div>
                    <div className="dash-reward-progress">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[11.5px] text-[var(--colour-ink-quiet)]">
                      <span>
                        {p.current.toLocaleString()} / {p.target.toLocaleString()}
                      </span>
                      <span>{pct}%</span>
                    </div>
                    {reached && (
                      <button
                        className="dash-btn dash-btn-primary"
                        style={{ marginTop: 4 }}
                        onClick={() => claim(m.id)}
                        disabled={Boolean(claimed)}
                      >
                        {claimed ? `Claimed ${claimed}` : "Claim"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="dash-col-12">
          <Panel eyebrow="How points work" title="The ledger">
            <ul className="text-[13.5px] text-[var(--colour-ink-soft)] leading-[1.9]">
              <li>+{POINTS.bibleDay} for every day you read the Word</li>
              <li>+{POINTS.cleanDay} for every clean day</li>
              <li>+{POINTS.taskDone} for every task completed</li>
              <li>+{POINTS.workoutDay} for every gym day</li>
              <li>+{POINTS.worshipDay} for every evening of worship</li>
              <li>+{POINTS.guitarSession} for every guitar session</li>
              <li>+{POINTS.bookWords1k} for every thousand words written</li>
            </ul>
            <div className="dash-divider" />
            <p className="text-[12.5px] text-[var(--colour-ink-quiet)] leading-relaxed">
              The point isn&apos;t the points. It&apos;s that what gets measured gets tended.
              Every box you tick is a vote for the kind of man you&apos;re becoming.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
