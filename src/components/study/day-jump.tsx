"use client";

// "Go to Day" - type a day of the reading plan (from the book or the Bible
// App) and open it: Day 1 is the plan's first page, 1 January 2026, for
// everyone - the group's days, Daniel's videos and members' journals.

import { useState } from "react";
import { planPage } from "@/lib/study/plan";

const long = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

export function DayJump({ onGo }: { onGo: (day: string) => void }) {
  const [n, setN] = useState("");
  const num = Number(n);
  const ok = /^\d{1,3}$/.test(n.trim()) && num >= 1 && num <= 365;

  return (
    <div className="day-jump">
      <label className="day-jump-row">
        <span className="eyebrow">Go to Day</span>
        <input
          className="dash-input day-jump-input"
          inputMode="numeric"
          placeholder="1"
          value={n}
          onChange={(e) => setN(e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && ok) onGo(planPage(num));
          }}
          aria-label="Day of the reading plan, 1 to 365"
        />
        <span className="dash-word-hint">of 365</span>
      </label>
      {ok && (
        <div className="day-jump-picks">
          <button type="button" className="dash-starter-chip" onClick={() => onGo(planPage(num))}>
            Open Day {num} · {long(planPage(num))}
          </button>
        </div>
      )}
      {n && !ok && <p className="dash-starter-error">The plan has days 1 to 365.</p>}
    </div>
  );
}
