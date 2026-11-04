// A member's own saved Bible names (table member_names, scoped to the
// signed-in member). Handlers: src/lib/study/names-api.ts.
import { namesApi } from "@/lib/study/names-api";
import { memberScopeOf } from "@/lib/study/members";

export const dynamic = "force-dynamic";

const api = namesApi(memberScopeOf);
export const GET = api.GET;
export const POST = api.POST;
export const DELETE = api.DELETE;
