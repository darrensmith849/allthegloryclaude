// A member's own word journal (table member_words, scoped to the signed-in
// member). Handlers: src/lib/study/words-api.ts.
import { wordsApi } from "@/lib/study/words-api";
import { memberScopeOf } from "@/lib/study/members";

export const dynamic = "force-dynamic";

const api = wordsApi(memberScopeOf);
export const GET = api.GET;
export const PUT = api.PUT;
export const PATCH = api.PATCH;
export const DELETE = api.DELETE;
