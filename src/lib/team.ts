// The owner's team: members he has marked "team" (members.role = 'team') on
// /dashboard/members. Signed in with their own Study account, they get a
// small part of the dashboard - Names of God, their own Study Notes (a
// private journal, not shown to members), Members and Community - and nothing else
// (analytics, tasks, the owner's study, settings pages...). Checked in the
// middleware, and again in the owner-only actions themselves.

import { isSignedIn } from "@/lib/admin-auth";
import { getMember, type Member } from "@/lib/study/members";

// Family (members.role = 'personal' - Daniel's sister): her own private
// dashboard, set up by Daniel in Settings and logged into with one password.
// Her own Study Notes, Word Journal, Names of God, Money and To do - each
// kept in her own rows, never the owner's - and nothing else of his.
const PERSONAL_PAGES = ["/dashboard/notes", "/dashboard/word-study", "/dashboard/names", "/dashboard/money", "/dashboard/todo"];
export const PERSONAL_HOME = "/dashboard/notes";

export function personalAllowed(pathname: string): boolean {
  if (PERSONAL_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return !pathname.startsWith("/dashboard/notes/read");
  return pathname === "/api/dashboard-state";
}

const TEAM_PAGES = ["/dashboard/names", "/dashboard/notes", "/dashboard/members", "/dashboard/community"];

export function teamAllowed(pathname: string): boolean {
  if (TEAM_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return !pathname.startsWith("/dashboard/notes/read");
  return pathname === "/api/members" || pathname.startsWith("/api/members/");
}

export type DashboardUser = { role: "owner" } | { role: "team"; member: Member } | { role: "personal"; member: Member };

// Who is using the dashboard: the owner, a team member, family, or nobody.
export async function dashboardUser(req: Request): Promise<DashboardUser | null> {
  if (await isSignedIn(req.headers.get("cookie"))) return { role: "owner" };
  const member = await getMember(req).catch(() => null);
  if (member?.team) return { role: "team", member };
  if (member?.personal) return { role: "personal", member };
  return null;
}

// Whose saved dashboard (table dashboard_state) a user reads and writes:
// the owner's row as it always was, or family's own.
export const stateIdOf = (u: DashboardUser): string | null =>
  u.role === "owner" ? "owner" : u.role === "personal" ? `member:${u.member.id}` : null;

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

// Tells the dashboard on this device whose saved copy to keep (readable by
// the page - src/lib/dashboard/storage.ts): set when family logs in, cleared
// when the owner does or anyone logs out. Not a login - the server always
// decides whose data a request gets from the session itself.
export const WHO_COOKIE = "atg-who";
export const whoCookie = (stateId: string) => `${WHO_COOKIE}=${stateId}; Path=/; Secure; SameSite=Lax; Max-Age=${90 * 86_400}`;
export const clearedWhoCookie = () => `${WHO_COOKIE}=; Path=/; Secure; SameSite=Lax; Max-Age=0`;
