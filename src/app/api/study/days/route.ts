// A member's own day titles and takeaways (table member_days, scoped to the
// signed-in member). Handlers: src/lib/study/days-api.ts.
import { daysApi } from "@/lib/study/days-api";
import { memberScopeOf } from "@/lib/study/members";

export const dynamic = "force-dynamic";

const api = daysApi(memberScopeOf);
export const GET = api.GET;
export const PUT = api.PUT;
