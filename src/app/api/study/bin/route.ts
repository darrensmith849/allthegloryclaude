// A member's own Recycle bin (restore / empty), scoped to the signed-in
// member. Handlers in src/lib/study/bin-api.ts.
import { binApi } from "@/lib/study/bin-api";
import { memberScopeOf } from "@/lib/study/members";

export const dynamic = "force-dynamic";

export const POST = binApi(memberScopeOf).POST;
