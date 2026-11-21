"use client";

// Money - Daniel's own spending tracker (and family's, on her own dashboard).
// The screen is src/components/dashboard/money-view.tsx; friends get the same
// screen, kept in their own browser, at /money-tracker.

import { MoneyView } from "@/components/dashboard/money-view";
import { useDashboard } from "@/lib/dashboard/storage";
import { useDashUser } from "@/lib/dashboard/who";

export default function MoneyPage() {
  const store = useDashboard();
  const user = useDashUser();
  return <MoneyView store={store} user={user} />;
}
