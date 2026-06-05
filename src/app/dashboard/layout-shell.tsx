"use client";

// Client wrapper around the dashboard layout. Lets us conditionally render
// the sidebar — the welcome page at /dashboard takes over the full viewport
// (no sidebar), every other /dashboard/* route gets the sidebar shell.

import { usePathname } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/sidebar";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWelcome = pathname === "/dashboard";

  if (isWelcome) {
    return <div className="dash-welcome-root">{children}</div>;
  }
  return (
    <div className="dash-root">
      <DashboardSidebar />
      <main className="dash-main">{children}</main>
    </div>
  );
}
