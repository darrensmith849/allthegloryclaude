// Single source of brand-controlled text. "Ngoma" is a working name only
// (MASTER_PLAN §1, §18): renaming the company is an edit to this file.

export const brand = {
  name: "Ngoma",
  nameStatus: "working-name" as const,
  legalEntity: null as string | null, // contracting entity awaits owner/legal approval
  tagline: "Africa's sound, connected to the world.",
  campaignLine: "Africa's sound, booked by the world.",
  description:
    "A Zimbabwean-founded, Africa-first music company connecting producers, engineers, writers, musicians and vocalists with paid work, professional infrastructure and international collaborators.",
  shortDescription: "Production, session talent, managed projects and artist business infrastructure — from Africa, for the world.",
  founded: "Zimbabwe",
  // Policy versions are recorded with every consent record.
  policyVersions: {
    privacy: "2026-10-draft-1",
    terms: "2026-10-draft-1",
    marketingConsent: "2026-10-mc-1",
  },
} as const;

export type Brand = typeof brand;
