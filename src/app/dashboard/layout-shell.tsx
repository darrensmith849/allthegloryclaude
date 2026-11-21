"use client";

// Client wrapper around the dashboard layout. Lets us conditionally render
// the sidebar - the welcome page at /dashboard takes over the full viewport
// (no sidebar), every other /dashboard/* route gets the sidebar shell.

import { usePathname } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/sidebar";
import CommandPalette from "@/components/dashboard/command-palette";
import { DashAppCard } from "@/components/dashboard/app-card";
import { useDashUser } from "@/lib/dashboard/who";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWelcome = pathname === "/dashboard";
  // The ⌘K palette loads Daniel's own data - not for his team.
  const owner = useDashUser()?.role === "owner";

  // The login page stands alone - no sidebar, and no command palette (it
  // loads dashboard data, which needs a session).
  if (pathname === "/dashboard/login") return <div className="dash-welcome-root">{children}</div>;

  if (isWelcome) {
    return (
      <div className="dash-welcome-root">
        {children}
        <CommandPalette />
      </div>
    );
  }
  return (
    <div className="dash-root">
      <DashboardSidebar />
      <main className="dash-main">
        <DashAppCard />
        {children}
      </main>
      {owner && <CommandPalette />}
    </div>
  );
}
