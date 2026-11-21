"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { REMINDERS, reminderForDate } from "@/lib/dashboard/reminders";
import { todayISO, formatHuman } from "@/lib/dashboard/dates";
import { DASHBOARD, Reminders } from "@/components/study/reminders";
import { IosInstallGuide } from "@/components/study/ios-install-guide";

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

      {/* Daniel's own daily reading reminder on this device. */}
      <section className="study-app-card dash-app-card" id="daily">
        <span className="eyebrow eyebrow-amber">On your phone</span>
        <h2 className="study-app-title">Daily reading reminder</h2>
        <p className="study-app-text">
          A notification at the time you pick - tap it and your Study Notes open. Skipped on days you&apos;ve already marked as
          read. On iPhone it works from the dashboard on your Home Screen.
        </p>
        <Reminders
          target={DASHBOARD}
          installGuide={
            <IosInstallGuide
              forReminders
              app="your dashboard"
              link="https://alltheglory.co.za/dashboard"
              last={
                <>
                  Open <strong>ATG Dashboard</strong> from your Home Screen (the dark dove), log in once, and come back to Menu →
                  Reminders to turn it on.
                </>
              }
            />
          }
        />
      </section>

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
