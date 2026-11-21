// Tells the login screen whether to ask for a new password (first visit)
// or the existing one - and the dashboard who's using it (the owner, a
// team member with their part of it, or family with her own).
import { getAdminRecord } from "@/lib/admin-auth";
import { dashboardUser, firstName } from "@/lib/team";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const [rec, who] = await Promise.all([getAdminRecord(true), dashboardUser(req)]);
  return Response.json(
    {
      configured: Boolean(rec),
      signedIn: who?.role === "owner",
      role: who?.role ?? null,
      ...(who && who.role !== "owner" ? { name: firstName(who.member.name), memberId: who.member.id } : {}),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
