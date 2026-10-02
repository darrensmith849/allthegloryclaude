// First-time setup: creates the admin password - only while none exists -
// and signs this device in.
import {
  createAdminRecord,
  createSession,
  getAdminRecord,
  hashPassword,
  MIN_PASSWORD,
  sessionCookie,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (await getAdminRecord(true)) {
    return Response.json({ error: "A password is already set. Log in instead." }, { status: 409 });
  }
  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  const password = String(body.password ?? "");
  if (password.length < MIN_PASSWORD || password.length > 200) {
    return Response.json(
      { error: `Use at least ${MIN_PASSWORD} characters.` },
      { status: 400 },
    );
  }
  try {
    const rec = await hashPassword(password);
    if (!(await createAdminRecord(rec))) {
      return Response.json({ error: "A password is already set. Log in instead." }, { status: 409 });
    }
    return Response.json(
      { ok: true },
      { headers: { "set-cookie": sessionCookie(await createSession(rec)), "cache-control": "no-store" } },
    );
  } catch (e) {
    console.error("admin setup:", e);
    return Response.json({ error: "Couldn't save the password. Try again." }, { status: 500 });
  }
}
