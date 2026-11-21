// A member's own study notes (table member_notes, scoped to the signed-in
// member). Handlers: src/lib/study/notes-api.ts.
import { notesApi } from "@/lib/study/notes-api";
import { memberScopeOf } from "@/lib/study/members";

export const dynamic = "force-dynamic";

const api = notesApi(memberScopeOf);
export const GET = api.GET;
export const POST = api.POST;
export const PATCH = api.PATCH;
export const DELETE = api.DELETE;
