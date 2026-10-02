// Ends the admin session on this device.
import { clearedSessionCookie } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  return new Response(null, { status: 204, headers: { "set-cookie": clearedSessionCookie() } });
}
