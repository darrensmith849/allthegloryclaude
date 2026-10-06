// The owner's saved Bible names (table study_names). The dashboard
// middleware requires the admin session; the handlers are in
// src/lib/study/names-api.ts.
import { namesApi } from "@/lib/study/names-api";
import { OWNER_SCOPE } from "@/lib/study/scope";

export const dynamic = "force-dynamic";

const api = namesApi(async () => OWNER_SCOPE);
export const GET = api.GET;
export const POST = api.POST;
export const DELETE = api.DELETE;
