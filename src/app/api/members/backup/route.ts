/**
 * Backups of The Study (private R2 bucket, see src/lib/study/backup-core.ts).
 * Admin session required (middleware).
 *
 *   GET            -> { last, backups: [{ key, size, at, rows, reason }] }
 *   GET ?key=...   -> that backup file, to download
 *   POST           -> { backup }   back up now
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/analytics/store";
import { BACKUP_PREFIX, runBackup, type R2Like } from "@/lib/study/backup-core";
import { isSignedIn } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function bucket(): Promise<R2Like | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return ((env as unknown as { BACKUPS?: R2Like }).BACKUPS ?? null) as R2Like | null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const b = await bucket();
  const db = await getDb();
  if (!b || !db) return Response.json({ error: "Backups aren't available here." }, { status: 503 });
  const key = new URL(req.url).searchParams.get("key");
  if (key) {
    if (!(await isSignedIn(req.headers.get("cookie")))) {
      return Response.json({ error: "Only Daniel can download backups." }, { status: 403 });
    }
    if (!key.startsWith(BACKUP_PREFIX) || key.includes("..")) return Response.json({ error: "No such backup." }, { status: 404 });
    const obj = await b.get(key);
    if (!obj) return Response.json({ error: "No such backup." }, { status: 404 });
    return new Response(obj.body, {
      headers: {
        "content-type": "application/json",
        "content-disposition": `attachment; filename="the-study-backup-${key.slice(BACKUP_PREFIX.length).replace(/\//g, "-")}"`,
        "cache-control": "no-store",
      },
    });
  }
  const objects: Awaited<ReturnType<R2Like["list"]>>["objects"] = [];
  let cursor: string | undefined;
  do {
    const page = await b.list({ prefix: BACKUP_PREFIX, cursor, limit: 1000, include: ["customMetadata"] });
    objects.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor && objects.length < 5000);
  objects.sort((x, y) => (x.key < y.key ? 1 : -1));
  const lastRow = await db
    .prepare("SELECT value FROM study_settings WHERE key = 'last_backup'")
    .first<{ value: string }>()
    .catch(() => null);
  return Response.json(
    {
      last: lastRow ? JSON.parse(lastRow.value) : null,
      count: objects.length,
      backups: objects.slice(0, 60).map((o) => ({
        key: o.key,
        size: o.size,
        at: new Date(o.uploaded).getTime(),
        rows: Number(o.customMetadata?.rows ?? 0),
        reason: o.customMetadata?.reason ?? "",
      })),
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST() {
  const b = await bucket();
  const db = await getDb();
  if (!b || !db) return Response.json({ error: "Backups aren't available here." }, { status: 503 });
  try {
    const backup = await runBackup(db as never, b, "manual");
    return Response.json({ backup });
  } catch (e) {
    console.error("backup:", e);
    return Response.json({ error: "Couldn't back up just now." }, { status: 500 });
  }
}
