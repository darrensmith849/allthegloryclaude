# Decisions awaiting owner approval

Everything here is configurable; none of it blocked Phase 1.

| Decision | Where it is configured | Current state |
| --- | --- | --- |
| Final company name and logo | `src/platform/config/brand.ts`, `src/platform/components/site/Logo.tsx` | “Ngoma” shown with a “Working name” label; line-art mark is a placeholder. |
| Visual identity | `src/platform/styles/tokens.css` | Follows the All the Glory `/websites` page (owner request). A brand pass can shift accent and type here without touching components. |
| Final domain / `/agency` demonstration | `NEXT_PUBLIC_SITE_URL`, `NEXT_BASE_PATH` | Not set. |
| Public launch roster | `src/platform/config/approvals.ts` → `approvedRoster` | Empty. Eight fictional sample profiles are shown, labelled and noindexed. |
| Approved public partners | `src/platform/config/approvals.ts` → `partnerAssociations` | Arts-support partner is `proposed`; its name is withheld everywhere. |
| Contact email and WhatsApp | `NEXT_PUBLIC_AGENCY_CONTACT_EMAIL`, `NEXT_PUBLIC_AGENCY_CONTACT_WHATSAPP` | Not set; the site points to the brief form. |
| Service prices and commission rates | `commercialApprovals` + per-contract commission | Unpublished. Demo figures are labelled as invented. |
| Contracting legal entity | `brand.legalEntity` | `null`; legal pages say “to be confirmed”. |
| Zimbabwe / South Africa operating structure | — | Open. Affects invoices, tax, payouts and governing law. |
| Payment and email providers | Service interfaces in `src/platform/server/core-api` and Phase 2 API | Not selected. |
| Arts-support agreement and territories | `partnerAssociations` | Proposal only. |
| Website incentive thresholds | `commercialApprovals.websiteIncentiveThresholdsPublished` | Marked “under validation”. |
| Legal text | `src/app/(site)/{privacy,cookies,terms}` | Drafts for lawyer review. |
| Data-protection contact and retention periods | Privacy notice | Placeholder retention (24 months for non-converting submissions) pending advice. |
| Hosting region for PostgreSQL | Hetzner | EU region assumed in the draft privacy notice. |

## Recording an approval

1. Store the signed approval (email, contract or form) in the document system.
2. Set `status: "approved"`, the `publicName` and the `approvalReference` in `src/platform/config/approvals.ts`.
3. Only then add the real profile, partner name, price or threshold.
