"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { REMINDERS, reminderForDate } from "@/lib/dashboard/reminders";
import { todayISO, formatHuman } from "@/lib/dashboard/dates";

export default function RemindersPage() {
  // Today's date is filled in on the device (the page is built ahead of time).
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayISO()), []);
  const todayReminder = today ? reminderForDate(today) : null;

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">{today ? formatHuman(today) : "\u00a0"}</div>
          <h1 className="dash-title mt-1">Reminders</h1>
          <div className="dash-subtitle">
            All five together. One rotates onto the Today page each morning - the rest stay here.
          </div>
        </div>
      </div>

      <div className="dash-reminders-grid">
        {REMINDERS.map((r) => (
          <article
            key={r.id}
            className={`dash-reminder-tile ${r.id === todayReminder?.id ? "is-today" : ""}`}
          >
            <Image
              src={r.src}
              alt={r.short}
              fill
              sizes="(min-width: 1100px) 320px, (min-width: 700px) 45vw, 90vw"
              className="object-cover object-center"
              loading={r.id === todayReminder?.id ? "eager" : "lazy"}
              priority={r.id === todayReminder?.id}
            />
            {r.id === todayReminder?.id && (
              <div className="dash-reminder-badge">
                <span className="eyebrow eyebrow-amber">Today</span>
              </div>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
