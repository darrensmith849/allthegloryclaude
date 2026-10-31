import { z } from "zod";
import { coreApi } from "@/platform/server/core-api";
import { allowedOriginsFor } from "@/platform/server/env";
import { isAllowedOrigin } from "@/platform/server/security/origin";

// First-party, cookie-free analytics intake (MASTER_PLAN §12). Accepts only a
// fixed set of event names and short scalar properties; never form content.

export const dynamic = "force-dynamic";

const eventNames = ["page_view", "profile_view", "media_play", "brief_start", "brief_submit", "application_start", "application_submit", "cta_click", "outbound_click", "demo_view"] as const;

const payload = z.object({
  events: z
    .array(
      z.object({
        name: z.enum(eventNames),
        path: z.string().max(200).regex(/^\/[\w\-/]*$/),
        session: z.string().regex(/^[a-z0-9]{8,32}$/),
        props: z.record(z.string().max(40), z.union([z.string().max(80), z.number(), z.boolean()])).optional(),
      }),
    )
    .min(1)
    .max(20),
});

export async function POST(request: Request): Promise<Response> {
  if (!isAllowedOrigin(request.headers, allowedOriginsFor(request))) return new Response(null, { status: 403 });
  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  const occurredAt = new Date().toISOString();
  await (await coreApi()).recordEvents(parsed.data.events.map((e) => ({ ...e, occurredAt }))).catch(() => undefined);
  return new Response(null, { status: 204 });
}
