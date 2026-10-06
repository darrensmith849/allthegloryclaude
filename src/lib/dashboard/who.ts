"use client";

// Who is using the dashboard: the owner, or a team member (their own Study
// Notes, Members and Community only - see src/lib/team.ts). Asked once per
// page load and shared.

import { useEffect, useState } from "react";

export type DashUser = { role: "owner" } | { role: "team"; name: string; memberId: string } | null;

let cached: DashUser | undefined;
let pending: Promise<DashUser> | null = null;

function load(): Promise<DashUser> {
  pending ??= fetch("/api/admin/status", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { role?: string | null; name?: string; memberId?: string } | null): DashUser =>
      d?.role === "owner" ? { role: "owner" } : d?.role === "team" && d.memberId ? { role: "team", name: d.name ?? "", memberId: d.memberId } : null,
    )
    .catch(() => null)
    .then((u) => {
      cached = u;
      return u;
    });
  return pending;
}

// undefined while checking.
export function useDashUser(): DashUser | undefined {
  const [user, setUser] = useState<DashUser | undefined>(cached);
  useEffect(() => {
    if (cached !== undefined) return;
    let live = true;
    void load().then((u) => live && setUser(u));
    return () => {
      live = false;
    };
  }, []);
  return user;
}

export const TEAM_NAV = ["/dashboard/names", "/dashboard/notes", "/dashboard/members", "/dashboard/community"];
