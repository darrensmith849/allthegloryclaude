// The owner's day titles and takeaways (table study_days). The dashboard
// middleware requires the admin session; the handlers are in
// src/lib/study/days-api.ts.
import { daysApi } from "@/lib/study/days-api";
import { OWNER_SCOPE } from "@/lib/study/scope";

export const dynamic = "force-dynamic";

const api = daysApi(async () => OWNER_SCOPE);
export const GET = api.GET;
export const PUT = api.PUT;
export const PATCH = api.PATCH;
