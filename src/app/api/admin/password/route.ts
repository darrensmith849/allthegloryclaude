// Changes the admin password (Settings). Needs the current password; the
// new one signs this device in and logs every other device out.
import {
  checkPasswordAnyDevice,
  createSession,
  getAdminRecord,
  hashPassword,
  isSignedIn,
  MIN_PASSWORD,
  saveAdminRecord,
  sessionCookie,
  tidyPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await isSignedIn(req.headers.get("cookie")))) {
    return Response.json({ error: "Please log in to the dashboard." }, { status: 401 });
  }
  const rec = await getAdminRecord(true);
  const body = (await req.json().catch(() => ({}))) as { current?: unknown; next?: unknown };
  const current = String(body.current ?? "");
  const next = tidyPassword(String(body.next ?? ""));
  if (!rec || !(await checkPasswordAnyDevice(current, rec))) {
    await new Promise((r) => setTimeout(r, 600));
    return Response.json({ error: "Your current password isn't right." }, { status: 401 });
  }
  if (next.length < MIN_PASSWORD || next.length > 200) {
    return Response.json({ error: `Use at least ${MIN_PASSWORD} characters.` }, { status: 400 });
  }
  try {
    const fresh = await hashPassword(next);
    await saveAdminRecord(fresh);
    return Response.json(
      { ok: true },
      { headers: { "set-cookie": sessionCookie(await createSession(fresh)), "cache-control": "no-store" } },
    );
  } catch (e) {
    console.error("admin password:", e);
    return Response.json({ error: "Couldn't change the password. Try again." }, { status: 500 });
  }
}
