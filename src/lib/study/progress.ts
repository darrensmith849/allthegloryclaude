// Where a member is up to in the plan (server side): the page after the
// furthest one they've marked as read - see nextPage in ./plan.ts.

import { PLAN_END, planPage, STUDY_START } from "./plan";
import { planDay } from "@/lib/dashboard/notes";

interface D1Like {
  prepare(sql: string): { bind(...args: unknown[]): { first<T = Record<string, unknown>>(): Promise<T | null> } };
}

export async function memberReach(db: D1Like, memberId: string): Promise<string> {
  const row = await db
    .prepare("SELECT MAX(day) AS day FROM member_days WHERE member_id = ?1 AND read_at IS NOT NULL AND day >= ?2 AND day <= ?3")
    .bind(memberId, STUDY_START, PLAN_END)
    .first<{ day: string | null }>()
    .catch(() => null);
  return row?.day ? planPage(planDay(row.day).n + 1) : STUDY_START;
}
