"use client";

import Image from "next/image";
import { REMINDERS, reminderForDate } from "@/lib/dashboard/reminders";
import { todayISO, formatHuman } from "@/lib/dashboard/dates";

export default function RemindersPage() {
  const today = todayISO();
  const todayReminder = reminderForDate(today);

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">{formatHuman(today)}</div>
          <h1 className="dash-title mt-1">Reminders</h1>
          <div className="dash-subtitle">
            All five together. One rotates onto the Today page each morning — the rest stay here.
          </div>
        </div>
      </div>

      <div className="dash-reminders-grid">
        {REMINDERS.map((r) => (
          <article
            key={r.id}
            className={`dash-reminder-tile ${r.id === todayReminder.id ? "is-today" : ""}`}
          >
            <Image
              src={r.src}
              alt={r.short}
              fill
              sizes="(min-width: 1100px) 320px, (min-width: 700px) 45vw, 90vw"
              className="object-cover object-center"
              loading={r.id === todayReminder.id ? "eager" : "lazy"}
              priority={r.id === todayReminder.id}
            />
            {r.id === todayReminder.id && (
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
