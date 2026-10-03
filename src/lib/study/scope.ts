// Whose study a request reads and writes.
//
// The owner's study lives in the study_* tables (private dashboard); each
// member's journal lives in the member_* tables, every row tagged with
// member_id. The notes / words / days APIs are written once against a
// Scope, so a member request can only ever touch member_* rows with its own
// member_id - never the owner's tables.

export interface Scope {
  notes: "study_notes" | "member_notes";
  noteVersions: "study_note_versions" | "member_note_versions";
  words: "study_words" | "member_words";
  wordVersions: "study_word_versions" | "member_word_versions";
  days: "study_days" | "member_days";
  dayVersions: "study_day_versions" | "member_day_versions";
  member: string | null; // null = the owner
}

export const OWNER_SCOPE: Scope = {
  notes: "study_notes",
  noteVersions: "study_note_versions",
  words: "study_words",
  wordVersions: "study_word_versions",
  days: "study_days",
  dayVersions: "study_day_versions",
  member: null,
};

export const memberScope = (id: string): Scope => ({
  notes: "member_notes",
  noteVersions: "member_note_versions",
  words: "member_words",
  wordVersions: "member_word_versions",
  days: "member_days",
  dayVersions: "member_day_versions",
  member: id,
});

// Resolves the scope for a request, or the Response to send instead (401).
export type ScopeOf = (req: Request) => Promise<Scope | Response>;

// SQL pieces. Queries use positional "?" params, so the scope's args go
// where its placeholder sits: first for inserts (pre / preQ), last for
// WHERE clauses (andMine).
export const mine = (s: Scope) => (s.member ? "member_id = ?" : "1 = 1");
export const andMine = (s: Scope) => (s.member ? " AND member_id = ?" : "");
export const mineArgs = (s: Scope): string[] => (s.member ? [s.member] : []);
export const pre = (s: Scope) => (s.member ? "member_id, " : "");
export const preQ = (s: Scope) => (s.member ? "?, " : "");
