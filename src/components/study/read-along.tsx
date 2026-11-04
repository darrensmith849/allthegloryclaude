// How to read along: the paper book (or a second screen) for the reading,
// the journal for the notes. On "Where we start" (members' home + journal)
// and at the top of Read here.

import { PLAN } from "@/lib/study/plan";

export function ReadAlong({ className }: { className?: string }) {
  return (
    <p className={className}>
      <strong>Reading along.</strong> Get a softcover paper copy - <em>{PLAN.name}</em> (NIV) from{" "}
      <a href={PLAN.takealot} target="_blank" rel="noreferrer">
        Takealot
      </a>{" "}
      or{" "}
      <a href={PLAN.amazon} target="_blank" rel="noreferrer">
        Amazon
      </a>{" "}
      - and write your notes here as you read. Or read on your computer or another device, and make your notes on the other.
    </p>
  );
}
