"use client";

// "Go to Day" - type a day of the reading plan (from the book or the Bible
// App) and open it this year or next. For writing ahead: Genesis 1 studied
// in October goes on Day 1, 1 January next year.

import { useState } from "react";
import { planDate, todayDay } from "@/lib/dashboard/notes";

const long = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

export function DayJump({ onGo }: { onGo: (day: string) => void }) {
  const [n, setN] = useState("");
  const num = Number(n);
  const ok = /^\d{1,3}$/.test(n.trim()) && num >= 1 && num <= 365;
  const year = Number(todayDay().slice(0, 4));

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
            if (e.key === "Enter" && ok) onGo(planDate(num, year + (planDate(num, year) < todayDay() ? 1 : 0)));
          }}
          aria-label="Day of the reading plan, 1 to 365"
        />
        <span className="dash-word-hint">of 365</span>
      </label>
      {ok && (
        <div className="day-jump-picks">
          {[year, year + 1].map((y) => (
            <button key={y} type="button" className="dash-starter-chip" onClick={() => onGo(planDate(num, y))}>
              {long(planDate(num, y))}
            </button>
          ))}
        </div>
      )}
      {n && !ok && <p className="dash-starter-error">The plan has days 1 to 365.</p>}
    </div>
  );
}
