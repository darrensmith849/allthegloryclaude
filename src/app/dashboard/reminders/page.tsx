"use client";

import Image from "next/image";
import { Panel } from "@/components/dashboard/panel";
import { REMINDERS, reminderForDate } from "@/lib/dashboard/reminders";
import { todayISO } from "@/lib/dashboard/dates";

export default function RemindersPage() {
  const today = todayISO();
  const todayReminder = reminderForDate(today);

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Daily images</div>
          <h1 className="dash-title mt-1">Reminders</h1>
          <div className="dash-subtitle">
            Things to remember while the day moves. One rotates onto the Today page each morning.
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col-12">
          <Panel eyebrow={`Today · ${todayReminder.short}`} title="Pinned reminder">
            <div className="dash-reminder-hero">
              <Image
                src={todayReminder.src}
                alt={todayReminder.short}
                fill
                sizes="(min-width: 900px) 1100px, 100vw"
                className="object-cover object-center"
                priority
              />
            </div>
          </Panel>
        </div>

        {REMINDERS.map((r) => (
          <div key={r.id} className="dash-col-6">
            <article className={`dash-reminder-tile ${r.id === todayReminder.id ? "is-today" : ""}`}>
              <Image
                src={r.src}
                alt={r.short}
                fill
                sizes="(min-width: 900px) 540px, 100vw"
                className="object-cover object-center"
              />
              {r.id === todayReminder.id && (
                <div className="dash-reminder-badge">
                  <span className="eyebrow eyebrow-amber">Today</span>
                </div>
              )}
            </article>
          </div>
        ))}
      </div>
    </>
  );
}
