// The owner's study notes (table study_notes). The dashboard middleware
// requires the admin session; the handlers are in src/lib/study/notes-api.ts.
import { notesApi } from "@/lib/study/notes-api";
import { OWNER_SCOPE } from "@/lib/study/scope";

export const dynamic = "force-dynamic";

const api = notesApi(async () => OWNER_SCOPE);
export const GET = api.GET;
export const POST = api.POST;
export const PATCH = api.PATCH;
export const DELETE = api.DELETE;
