// Ends the admin session on this device.
import { clearedSessionCookie } from "@/lib/admin-auth";
import { clearedWhoCookie } from "@/lib/team";

export const dynamic = "force-dynamic";

export async function POST() {
  const headers = new Headers();
  headers.append("set-cookie", clearedSessionCookie());
  headers.append("set-cookie", clearedWhoCookie());
  return new Response(null, { status: 204, headers });
}
