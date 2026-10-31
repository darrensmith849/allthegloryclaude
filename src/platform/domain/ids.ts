import { ulid } from "ulid";

// Sortable, URL-safe identifiers. The prefix makes an ID's entity obvious in
// logs and support conversations without exposing sequence numbers.
export type IdPrefix =
  | "org" | "usr" | "mem" | "art" | "cli" | "con" | "cns" | "enq" | "app" | "opp"
  | "prj" | "tsk" | "ctr" | "spl" | "quo" | "inv" | "pay" | "pst" | "doc" | "ref" | "evt" | "aud" | "out";

export function newId(prefix: IdPrefix): string {
  return `${prefix}_${ulid().toLowerCase()}`;
}

/** Short reference for people (e.g. "ENQ-7K2QM9"), derived from an ID. */
export function humanReference(id: string): string {
  const [prefix = "", body = ""] = id.split("_");
  return `${prefix.toUpperCase()}-${body.slice(-6).toUpperCase()}`;
}
