"use client";

// /money-tracker - Daniel's Money screen for friends: starts empty (they set
// their own balance and budget, in rand), saved only in their own browser.
// See src/lib/money-tracker/store.ts.

import { useRef, useState } from "react";
import { MoneyView } from "@/components/dashboard/money-view";
import { ThemeToggle } from "@/components/study/theme-toggle";
import { TrackerInstallCard } from "@/components/money-tracker/install-card";
import { useTrackerStore } from "@/lib/money-tracker/store";
import type { DashUser } from "@/lib/dashboard/who";

const FRIEND: DashUser = { role: "personal", name: "", memberId: "" };

export default function MoneyTrackerPage() {
  const { store, saved, backup, restore } = useTrackerStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);

  function saveBackup() {
    const b = backup();
    if (!b) return setNote("Nothing to back up yet - add your balance first.");
    const blob = new Blob([JSON.stringify(b)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `money-backup-${b.savedAt.slice(0, 10)}.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setNote("Backup saved to your downloads. Keep it somewhere safe.");
  }

  async function loadBackup(file: File | undefined) {
    if (!file) return;
    try {
      const ok = restore(JSON.parse(await file.text()));
      setNote(ok ? "Backup put back - everything is as it was when you saved it." : "That file isn't a Money Tracker backup.");
    } catch {
      setNote("That file isn't a Money Tracker backup.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      <div className="flex justify-end mb-2">
        <ThemeToggle />
      </div>
      {!saved && (
        <p className="dash-starter-error mb-4">
          This browser isn&apos;t keeping your figures (a private window?). Open this page in a normal window so nothing is lost.
        </p>
      )}
      <TrackerInstallCard />
      <MoneyView store={store} user={FRIEND} />
      <section className="dash-card mt-8 p-5" aria-label="Where your money is kept">
        <div className="eyebrow eyebrow-amber">🔒 Private to this device</div>
        <p className="dash-word-hint mt-2">
          Everything you enter stays in this browser on this phone or computer. Nobody else can see it, not even All The Glory. Clearing your
          browser data deletes it, so save a backup now and then. On a phone, use Add to Home Screen to keep it like an app.
        </p>
        <div className="flex gap-2 flex-wrap mt-3">
          <button type="button" className="dash-btn dash-btn-primary" onClick={saveBackup}>
            Save a backup
          </button>
          <button type="button" className="dash-btn dash-btn-ghost" onClick={() => fileRef.current?.click()}>
            Put a backup back
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void loadBackup(e.target.files?.[0])} />
        </div>
        {note && (
          <p className="dash-word-saved mt-3" role="status">
            {note}
          </p>
        )}
      </section>
    </>
  );
}
