// Lifecycle states beyond "new" (MASTER_PLAN §7) with allowed transitions.

export const enquiryStates = ["new", "triaged", "scoping", "quoted", "won", "lost", "archived", "spam"] as const;
export type EnquiryState = (typeof enquiryStates)[number];

const enquiryTransitions: Record<EnquiryState, EnquiryState[]> = {
  new: ["triaged", "spam", "archived"],
  triaged: ["scoping", "lost", "archived"],
  scoping: ["quoted", "lost", "archived"],
  quoted: ["won", "lost", "scoping"],
  won: ["archived"],
  lost: ["archived", "scoping"],
  archived: [],
  spam: [],
};

export const applicationStates = ["received", "under-review", "shortlisted", "verification", "verified", "declined", "withdrawn"] as const;
export type ApplicationState = (typeof applicationStates)[number];

const applicationTransitions: Record<ApplicationState, ApplicationState[]> = {
  received: ["under-review", "declined", "withdrawn"],
  "under-review": ["shortlisted", "declined", "withdrawn"],
  shortlisted: ["verification", "declined", "withdrawn"],
  verification: ["verified", "declined", "withdrawn"],
  verified: ["withdrawn"],
  declined: [],
  withdrawn: [],
};

export function canTransitionEnquiry(from: EnquiryState, to: EnquiryState): boolean {
  return enquiryTransitions[from].includes(to);
}

export function canTransitionApplication(from: ApplicationState, to: ApplicationState): boolean {
  return applicationTransitions[from].includes(to);
}
