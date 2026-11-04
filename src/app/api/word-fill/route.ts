// Word fill for the owner's dashboard (admin session required by the
// middleware). The work is in src/lib/dashboard/word-fill.ts.
import { fillWord } from "@/lib/dashboard/word-fill";

export const dynamic = "force-dynamic";

export function POST(req: Request) {
  return fillWord(req);
}
