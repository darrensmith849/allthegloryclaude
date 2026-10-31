import { partnerAssociations, partnerDisplayName } from "@/platform/config/approvals";
import type { TenantTheme } from "@/platform/config/theme";
import { findSampleProfile, type SampleProfile } from "@/platform/demo-data/roster";
import { settleProject, validateSplitSheet } from "@/platform/domain/settlement";
import { fictional, usd } from "./shared";

// DEMONSTRATION DATA — artist workspaces. Two fictional tenants rendered by
// the same code with different theme tokens: the multi-tenant model in
// miniature. No figure here is a real fee, credit or booking.

const partnerName = partnerDisplayName(partnerAssociations.artsSupportPartner, "Arts-support partner (proposed)");

export const artistTenantSlugs = ["msasa-room", "kopje-sound"] as const;
export type ArtistTenantSlug = (typeof artistTenantSlugs)[number];

export const tenantThemes: Record<ArtistTenantSlug, TenantTheme> = {
  // Gold: the platform default.
  "msasa-room": { accent: "#d8b25a", accent2: "#f1d7a6", accentInk: "#0c141a", accentSoft: "rgb(216 178 90 / 0.14)", canvas: "#0c141a" },
  // Soft teal on a teal-tinted dark canvas: same code, different tenant brand.
  "kopje-sound": { accent: "#7fc4b3", accent2: "#c3e8de", accentInk: "#0c141a", accentSoft: "rgb(127 196 179 / 0.14)", canvas: "#0a1517" },
};

interface Variant {
  stats: { opportunities: number; activeProjects: number; pendingSignatures: number; nextPayout: number };
  projectName: string;
  role: string;
  earnings: number[];
  splitShareLabel: string;
  weight: number;
}

const variants: Record<ArtistTenantSlug, Variant> = {
  "msasa-room": {
    stats: { opportunities: 6, activeProjects: 3, pendingSignatures: 1, nextPayout: 2100 },
    projectName: "Debut EP — demonstration project",
    role: "Production and arrangement",
    earnings: [900, 1400, 650, 2100, 1750, 2100],
    splitShareLabel: "Msasa Room (sample) — composition",
    weight: 50,
  },
  "kopje-sound": {
    stats: { opportunities: 4, activeProjects: 5, pendingSignatures: 2, nextPayout: 1150 },
    projectName: "Game soundtrack — act one",
    role: "Mixing and mastering",
    earnings: [1200, 980, 1350, 1100, 1500, 1150],
    splitShareLabel: "Kopje Sound (sample) — mix engineer points",
    weight: 30,
  },
};

export function isArtistTenant(slug: string): slug is ArtistTenantSlug {
  return (artistTenantSlugs as readonly string[]).includes(slug);
}

export function artistWorkspace(slug: ArtistTenantSlug) {
  const profile = findSampleProfile(slug) as SampleProfile;
  const v = variants[slug];

  const statement = settleProject({
    currency: "USD",
    receipts: [usd(2400), usd(2400), usd(1200)],
    approvedCosts: [usd(350), usd(400)],
    commission: { kind: "percentage", bps: 2000 },
    participants: [
      { creativeId: profile.name, weight: v.weight },
      { creativeId: "Other contributors (combined)", weight: 100 - v.weight },
    ],
  });

  const splitSigned = [
    { party: v.splitShareLabel, bps: 4000 },
    { party: "Copper & Dusk (sample) — topline and lyrics", bps: 4000 },
    { party: "Granite Hour (sample) — guitar motif", bps: 2000 },
  ];
  const splitDraft = [
    { party: v.splitShareLabel, bps: 5000 },
    { party: "Featured vocalist (to be confirmed)", bps: 4500 },
  ];

  return {
    profile,
    theme: tenantThemes[slug],
    stats: v.stats,
    role: v.role,
    completeness: [
      { label: "Profile and headline", value: 1, max: 1 },
      { label: "Portfolio (approved media)", value: 3, max: 4 },
      { label: "Credits verified", value: 0, max: 3 },
      { label: "Engagement terms signed", value: 1, max: 1 },
    ],
    passport: [
      { item: "Verified professional profile", status: "Verified" },
      { item: "Digital portfolio and press kit", status: "In progress" },
      { item: "Contracts, rights and earnings history", status: "Current" },
      { item: "Availability and skills directory", status: "Current" },
      { item: "Training and funding-readiness records", status: "In progress" },
      { item: "Membership and support referrals", status: "Not started" },
    ],
    deadlines: [
      { date: "04 Nov", title: "Sign split sheet — track 3", detail: v.projectName, status: "Action needed" },
      { date: "14 Nov", title: "Deliver mix v2 for client review", detail: "Revision round 1 of 2" },
      { date: "18 Nov", title: "Session hold — remote", detail: fictional("Lantern Agency") + " campaign" },
      { date: "28 Nov", title: "Final masters and stems", detail: v.projectName },
    ],
    media: [
      { title: "Placeholder sketch I", type: "Audio", visibility: "Public — approved", plays: 412 },
      { title: "Placeholder sketch II", type: "Audio", visibility: "Private", plays: 0 },
      { title: "Studio photograph (to be commissioned)", type: "Image", visibility: "Private", plays: 0 },
      { title: "Showreel (to be uploaded)", type: "Video", visibility: "Private", plays: 0 },
    ],
    credits: [
      { work: "“Placeholder sketch I” (demonstration title)", credit: v.role, evidence: "Split sheet CTR-0142-S", status: "Awaiting evidence" },
      { work: "Untitled release (demonstration)", credit: v.role, evidence: "Label confirmation requested", status: "Pending" },
      { work: "Campaign track (demonstration)", credit: v.role, evidence: "Contract on platform", status: "In review" },
    ],
    opportunities: [
      { ref: "OPP-0417", title: "Afro-house producer — brand campaign", fit: "Strong fit", status: "Shortlisted" },
      { ref: "OPP-0412", title: "String arrangement — film trailer", fit: "Partial fit", status: "Open" },
      { ref: "OPP-0409", title: "Co-writers — songwriting camp", fit: "Strong fit", status: "Open" },
    ],
    applications: [
      { ref: "APL-2210", opportunity: "Session work — gospel album", submitted: "21 Oct", status: "Declined" },
      { ref: "APL-2231", opportunity: "Afro-house producer — brand campaign", submitted: "27 Oct", status: "Shortlisted" },
    ],
    enquiries: [
      { from: fictional("Example Films"), subject: "Availability for a short-film score", received: "30 Oct", status: "New" },
      { from: "Independent artist (Nia Sample)", subject: "Feature request — routed via company", received: "26 Oct", status: "Acknowledged" },
    ],
    calendar: buildCalendar(slug),
    bookings: [
      { ref: "BKG-0091", what: "Remote session — campaign track", when: "18 Nov", status: "Hold" },
      { ref: "BKG-0088", what: v.role + " — " + v.projectName, when: "03–28 Nov", status: "Booked" },
      { ref: "BKG-0083", what: "Writing camp (example listing)", when: "08–12 Dec", status: "Pending" },
    ],
    briefs: [
      { ref: "PRJ-0142", title: v.projectName, client: fictional("Example Records"), stage: "Mixing", due: "28 Nov" },
      { ref: "PRJ-0137", title: "Campaign track and cut-downs", client: fictional("Lantern Agency"), stage: "Client review", due: "06 Nov" },
    ],
    submissions: [
      { file: "T3_mix_v2.wav", project: "PRJ-0142", submitted: "30 Oct", status: "Awaiting approval" },
      { file: "T1_master.wav", project: "PRJ-0142", submitted: "22 Oct", status: "Approved" },
      { file: "campaign_60s_v3.wav", project: "PRJ-0137", submitted: "27 Oct", status: "Changes requested" },
    ],
    contracts: [
      { ref: "CTR-ENG-01", title: "Creative engagement terms", status: "Signed", date: "03 Oct" },
      { ref: "CTR-0142-E1", title: "Engagement — " + v.projectName, status: "Signed", date: "03 Oct" },
      { ref: "CTR-0142-S", title: "Split sheet — track 3", status: "Awaiting signature", date: "30 Oct" },
    ],
    splitSigned,
    splitSignedCheck: validateSplitSheet(splitSigned),
    splitDraft,
    splitDraftCheck: validateSplitSheet(splitDraft),
    statement,
    statements: [
      { ref: "PST-0142-1", project: "PRJ-0142", period: "Oct 2026", amount: statement.payouts[0]!.amount, status: "Issued" },
      { ref: "PST-0126-1", project: "PRJ-0126", period: "Sep 2026", amount: usd(640), status: "Paid" },
      { ref: "PST-0119-2", project: "PRJ-0119", period: "Aug 2026", amount: usd(1100), status: "Paid" },
    ],
    earningsChart: { categories: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"], values: v.earnings },
    compliance: [
      { item: "Identity verification", status: "Verified", note: "Checked by roster team · documents held privately" },
      { item: "Tax reference provided", status: "Verified", note: "Value never shown in dashboards" },
      { item: "Payout account confirmed", status: "Verified", note: "Account details held by finance only" },
      { item: "Creative engagement terms", status: "Signed", note: "v1 · 03 Oct 2026" },
      { item: "Rights confirmation for portfolio", status: "Current", note: "Renews annually" },
      { item: "Work permit for in-person UK session", status: "Not started", note: "Only if a booking requires it" },
    ],
    insights: {
      categories: ["W38", "W39", "W40", "W41", "W42", "W43"],
      profileViews: slug === "msasa-room" ? [88, 102, 120, 141, 133, 160] : [64, 70, 92, 85, 101, 118],
      plays: slug === "msasa-room" ? [40, 52, 61, 77, 70, 84] : [21, 30, 26, 38, 44, 51],
      referrers: [
        { label: "Roster search", value: 46 },
        { label: "Artist website", value: 22 },
        { label: "Release page (campaign link)", value: 18 },
        { label: "Partner referral", value: 9 },
        { label: "Other", value: 5 },
      ],
    },
    training: [
      { label: "Contracts and split sheets", value: 3, max: 3 },
      { label: "Invoicing and tax basics", value: 2, max: 4 },
      { label: "Rights and royalties", value: 1, max: 4 },
      { label: "Funding readiness", value: 0, max: 3 },
    ],
    support: [
      { ref: "SR-104", type: "Business support referral", partner: partnerName, updated: "29 Oct", status: "In progress" },
      { ref: "SR-097", type: "Professional-service referral", partner: partnerName, updated: "11 Oct", status: "Closed" },
    ],
  };
}

export type ArtistWorkspace = ReturnType<typeof artistWorkspace>;

/** November 2026 starts on a Sunday; the grid starts on Monday. */
function buildCalendar(slug: ArtistTenantSlug) {
  const booked = slug === "msasa-room" ? [3, 4, 5, 6, 10, 11, 12, 13, 24, 25, 26, 27] : [2, 3, 4, 9, 10, 11, 16, 17, 23, 24];
  const hold = slug === "msasa-room" ? [18, 19] : [18, 25];
  const off = [1, 7, 8, 14, 15, 21, 22, 28, 29];
  const days: { day: number | null; state: "booked" | "hold" | "off" | "free" | "pad" }[] = [];
  for (let i = 0; i < 6; i++) days.push({ day: null, state: "pad" });
  for (let d = 1; d <= 30; d++) {
    days.push({ day: d, state: booked.includes(d) ? "booked" : hold.includes(d) ? "hold" : off.includes(d) ? "off" : "free" });
  }
  return days;
}
