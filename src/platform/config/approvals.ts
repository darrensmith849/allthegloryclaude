// Approvals register. Nothing that names a real person, organisation, price or
// commercial threshold is rendered publicly unless it is approved here, with a
// written-approval reference (MASTER_PLAN §2, §18; CLAUDE.md rule 4).

export type ApprovalStatus = "not-approached" | "in-conversation" | "proposed" | "approved";

export interface PublicAssociation {
  /** Internal key — never rendered. */
  key: string;
  /** Rendered only when status is "approved". */
  publicName: string | null;
  status: ApprovalStatus;
  /** Reference to the signed approval (document ID, date). Required before status "approved". */
  approvalReference: string | null;
}

/** Launch roster: empty until each creative signs a public-listing approval. */
export const approvedRoster: readonly PublicAssociation[] = [];

/** Partners. The arts-support collaboration is a proposal, so its name is withheld. */
export const partnerAssociations = {
  artsSupportPartner: {
    key: "arts-support-partner",
    publicName: null,
    status: "proposed",
    approvalReference: null,
  },
} as const satisfies Record<string, PublicAssociation>;

/** Commercial values stay unpublished until approved (MASTER_PLAN §3.4, §18). */
export const commercialApprovals = {
  servicePricesPublished: false,
  commissionRatesPublished: false,
  websiteIncentiveThresholdsPublished: false,
} as const;

export function isPubliclyApproved(association: PublicAssociation): association is PublicAssociation & { publicName: string; approvalReference: string } {
  return association.status === "approved" && Boolean(association.publicName) && Boolean(association.approvalReference);
}

/** Display name for a partner: the approved name, or a neutral description. */
export function partnerDisplayName(association: PublicAssociation, fallback: string): string {
  return isPubliclyApproved(association) ? association.publicName : fallback;
}
