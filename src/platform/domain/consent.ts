// Consent records (MASTER_PLAN §11, §13). Transactional handling of an
// enquiry and marketing permission are separate records: submitting a brief
// never implies marketing consent.

export type ConsentPurpose = "privacy-notice" | "marketing";
export type ConsentSource = "project-brief" | "roster-application" | "newsletter" | "dashboard";

export interface ConsentRecord {
  id: string;
  contactId: string;
  purpose: ConsentPurpose;
  granted: boolean;
  wordingVersion: string;
  source: ConsentSource;
  recordedAt: string;
  withdrawnAt: string | null;
}

export const consentWording = {
  privacy: "I have read the privacy notice and agree that my details are used to respond to this submission.",
  marketing: "Send me occasional news about opportunities, releases and programmes. I can unsubscribe at any time.",
} as const;

/** Only contacts with current, explicit marketing consent may be exported for marketing. */
export function isMarketable(records: ConsentRecord[], suppressed: boolean): boolean {
  if (suppressed) return false;
  const latest = records
    .filter((r) => r.purpose === "marketing")
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
  return Boolean(latest && latest.granted && !latest.withdrawnAt);
}
