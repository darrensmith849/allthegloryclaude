// The owner's word journal (table study_words). The dashboard middleware
// requires the admin session; the handlers are in src/lib/study/words-api.ts.
import { wordsApi } from "@/lib/study/words-api";
import { OWNER_SCOPE } from "@/lib/study/scope";

export const dynamic = "force-dynamic";

const api = wordsApi(async () => OWNER_SCOPE);
export const GET = api.GET;
export const PUT = api.PUT;
export const PATCH = api.PATCH;
export const DELETE = api.DELETE;
