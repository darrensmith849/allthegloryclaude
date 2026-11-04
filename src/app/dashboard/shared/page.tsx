"use client";

import { PrivacyCard } from "@/components/study/privacy-card";
import { SharedNotes } from "@/components/study/shared-notes";
import { useDashUser } from "@/lib/dashboard/who";

// Family's Shared notes, on her own dashboard. Daniel has no groups of his own
// here and no way into anyone's: he just sees what members are told.
export default function DashboardSharedPage() {
  const user = useDashUser();
  if (user === undefined) return null;
  if (user?.role === "personal") return <SharedNotes memberId={user.memberId} memberName={user.name} />;
  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">For members</div>
          <h1 className="dash-title mt-1">Shared notes</h1>
          <div className="dash-subtitle">Members can make private groups here. They&apos;re locked, so they can&apos;t be opened from your dashboard. This is what members are told:</div>
        </div>
      </div>
      <PrivacyCard />
    </>
  );
}
