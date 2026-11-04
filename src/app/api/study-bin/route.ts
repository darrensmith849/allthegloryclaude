// The owner's Recycle bin (restore / empty). The dashboard middleware
// requires the admin session; handlers in src/lib/study/bin-api.ts.
import { binApi } from "@/lib/study/bin-api";
import { OWNER_SCOPE } from "@/lib/study/scope";

export const dynamic = "force-dynamic";

export const POST = binApi(async () => OWNER_SCOPE).POST;
