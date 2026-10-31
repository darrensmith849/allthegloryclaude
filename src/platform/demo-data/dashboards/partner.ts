import { partnerAssociations, partnerDisplayName } from "@/platform/config/approvals";

// DEMONSTRATION DATA — partner workspace. The partner organisation is never
// named until the approvals register records written approval. Support data
// is workflow status only; details stay with the partner, never here.

export const partnerName = partnerDisplayName(partnerAssociations.artsSupportPartner, "Arts-support partner (proposed)");

export const partnerStats = { referred: 18, active: 12, trainingCompletions: 27, openSupport: 5, consentCoverage: "15 of 18" };

/** Names appear only where the artist has granted the partner consent to see them. */
export const referrals = [
  { member: "Msasa Room (sample)", referred: "12 Aug", programme: "Artist Business Passport", status: "Active", consent: "Granted" },
  { member: "Copper & Dusk (sample)", referred: "19 Aug", programme: "Artist Business Passport", status: "Verification", consent: "Granted" },
  { member: "Withheld — consent not granted", referred: "02 Sep", programme: "Training only", status: "Active", consent: "Not granted" },
  { member: "Lowveld Keys (sample)", referred: "11 Sep", programme: "Artist Business Passport", status: "Active", consent: "Granted" },
  { member: "Tide & Thread (sample)", referred: "07 Oct", programme: "Opportunity matching", status: "Pending", consent: "Granted" },
  { member: "Withheld — consent withdrawn", referred: "14 Oct", programme: "—", status: "Withdrawn", consent: "Withdrawn" },
];

export const benefits = [
  { name: "Artist Business Passport", detail: "Verified profile, portfolio, contracts and earnings history", eligibility: "Referred members" },
  { name: "Business support and training", detail: "Contracts, invoicing, rights and funding readiness", eligibility: "All members" },
  { name: "Professional-service referrals", detail: "Referral to independent professionals via the partner", eligibility: "Partner-assessed" },
  { name: "Opportunity notices", detail: "Matched sessions, productions and programmes", eligibility: "Verified profiles" },
];

export const events = [
  { date: "06 Nov", title: "Contracts and split sheets — workshop", detail: "Online · 24 places", status: "Open" },
  { date: "20 Nov", title: "Invoicing and tax basics", detail: "Online · 30 places", status: "Open" },
  { date: "04 Dec", title: "Funding readiness clinic", detail: "Hybrid · Harare", status: "Scheduled" },
];

export const supportCases = [
  { ref: "SR-104", category: "Business support referral", opened: "24 Oct", updated: "29 Oct", status: "In progress" },
  { ref: "SR-103", category: "Professional-service referral", opened: "21 Oct", updated: "28 Oct", status: "Acknowledged" },
  { ref: "SR-101", category: "Training request", opened: "15 Oct", updated: "20 Oct", status: "Closed" },
  { ref: "SR-099", category: "Professional-service referral", opened: "09 Oct", updated: "26 Oct", status: "Referred" },
  { ref: "SR-097", category: "Business support referral", opened: "02 Oct", updated: "11 Oct", status: "Closed" },
];

export const supportByStatus = [
  { label: "Received", value: 1 },
  { label: "Acknowledged", value: 1 },
  { label: "Referred", value: 1 },
  { label: "In progress", value: 2 },
  { label: "Closed (90 days)", value: 9 },
];

/** Aggregates only; any group smaller than five people is suppressed. */
export const impact = {
  quarters: ["Q1", "Q2", "Q3", "Q4*"],
  paidEngagements: [6, 11, 17, 9],
  trainingCompletions: [4, 8, 9, 6],
  earningsBand: "USD 20,000 – 30,000 paid to consenting referred creatives this year (demonstration band)",
  byOutcome: [
    { label: "Booked at least once", value: 11 },
    { label: "Profile verified", value: 13 },
    { label: "Completed training pathway", value: 8 },
    { label: "Funding application prepared", value: 5 },
  ],
};

export const consentGrants = [
  { member: "Msasa Room (sample)", scope: "Profile, programme status, aggregate earnings band", granted: "12 Aug 2026", expires: "12 Aug 2027", status: "Granted" },
  { member: "Copper & Dusk (sample)", scope: "Profile, programme status", granted: "19 Aug 2026", expires: "19 Aug 2027", status: "Granted" },
  { member: "Lowveld Keys (sample)", scope: "Programme status only", granted: "11 Sep 2026", expires: "11 Sep 2027", status: "Granted" },
  { member: "Member (name withheld)", scope: "—", granted: "14 Oct 2026", expires: "—", status: "Withdrawn" },
];

export const documentHistory = [
  { date: "29 Oct", title: "Data-sharing agreement — draft v0.3", detail: "Proposed; not signed. Awaiting legal review on both sides.", status: "Draft" },
  { date: "08 Oct", title: "Programme outline — Artist Business Passport v0.2", detail: "Joint proposal for discussion", status: "Draft" },
  { date: "17 Sep", title: "Consent wording for partner reporting — v1", detail: "Shown to artists before any grant", status: "Approved" },
];
