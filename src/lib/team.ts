// The owner's team: members he has marked "team" (members.role = 'team') on
// /dashboard/members. Signed in with their own Study account, they get a
// small part of the dashboard - Names of God, their own Study Notes (a
// private journal, not shown to members), Members and Community - and nothing else
// (analytics, tasks, the owner's study, settings pages...). Checked in the
// middleware, and again in the owner-only actions themselves.

import { isSignedIn } from "@/lib/admin-auth";
import { getMember, type Member } from "@/lib/study/members";

const TEAM_PAGES = ["/dashboard/names", "/dashboard/notes", "/dashboard/members", "/dashboard/community"];

export function teamAllowed(pathname: string): boolean {
  if (TEAM_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return !pathname.startsWith("/dashboard/notes/read");
  return pathname === "/api/members" || pathname.startsWith("/api/members/");
}

// The signed-in team member, if this request is from one.
export async function getTeamMember(req: Request): Promise<Member | null> {
  const member = await getMember(req).catch(() => null);
  return member?.team ? member : null;
}

// Who is using the dashboard: the owner, a team member, or nobody.
export async function dashboardUser(req: Request): Promise<{ role: "owner" } | { role: "team"; member: Member } | null> {
  if (await isSignedIn(req.headers.get("cookie"))) return { role: "owner" };
  const member = await getTeamMember(req);
  return member ? { role: "team", member } : null;
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
