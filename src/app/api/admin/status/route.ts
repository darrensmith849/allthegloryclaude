// Tells the login screen whether to ask for a new password (first visit)
// or the existing one.
import { getAdminRecord, isSignedIn } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rec = await getAdminRecord(true);
  return Response.json(
    { configured: Boolean(rec), signedIn: await isSignedIn(req.headers.get("cookie")) },
    { headers: { "cache-control": "no-store" } },
  );
}
