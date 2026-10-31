import type { EnquiryState } from "@/platform/domain/lifecycle";
import { settleProject, validateSplitSheet, type CommissionModel } from "@/platform/domain/settlement";
import { sum } from "@/platform/domain/money";
import { fictional, usd } from "./shared";

// DEMONSTRATION DATA — company master dashboard. Every name below is invented
// ("Example", "Sample", "Demo" surnames; "(fictional)" organisations).

export const companyStats = {
  openEnquiries: 14,
  activeProjects: 9,
  awaitingSignature: 4,
  verifiedCreatives: 23,
  pendingVerification: 7,
};

export interface EnquiryRow {
  ref: string;
  contact: string;
  organisation: string;
  services: string;
  budget: string;
  state: EnquiryState;
  received: string;
  owner: string;
}

export const enquiries: EnquiryRow[] = [
  { ref: "ENQ-7K2QM9", contact: "Rudo Example", organisation: fictional("Example Records"), services: "Production, mixing", budget: "USD 5,000 – 15,000", state: "new", received: "31 Oct", owner: "Unassigned" },
  { ref: "ENQ-6T1PZ4", contact: "Kofi Sample", organisation: fictional("Northbound Films"), services: "Music for picture", budget: "Over USD 15,000", state: "triaged", received: "30 Oct", owner: "Ops lead (demo)" },
  { ref: "ENQ-5R8LW2", contact: "Ama Demo", organisation: fictional("Lantern Agency"), services: "Sync, session players", budget: "USD 5,000 – 15,000", state: "scoping", received: "28 Oct", owner: "Ops lead (demo)" },
  { ref: "ENQ-4H3NB7", contact: "Tendai Placeholder", organisation: "Independent artist", services: "Single production", budget: "USD 1,000 – 5,000", state: "quoted", received: "24 Oct", owner: "Project manager (demo)" },
  { ref: "ENQ-3C9VX1", contact: "Nia Sample", organisation: fictional("Coastline Games"), services: "Score, mastering", budget: "Over USD 15,000", state: "won", received: "19 Oct", owner: "Project manager (demo)" },
  { ref: "ENQ-2D5KS8", contact: "Sipho Example", organisation: fictional("Hillside Choir Trust"), services: "Recording, mixing", budget: "Under USD 1,000", state: "lost", received: "12 Oct", owner: "Ops lead (demo)" },
  { ref: "ENQ-1F4JR6", contact: "Automated", organisation: "—", services: "—", budget: "—", state: "spam", received: "11 Oct", owner: "Filter" },
];

export const enquiryFunnel = [
  { label: "New", value: 5 },
  { label: "Triaged", value: 3 },
  { label: "Scoping", value: 3 },
  { label: "Quoted", value: 2 },
  { label: "Won (this quarter)", value: 6 },
  { label: "Lost (this quarter)", value: 4 },
];

export const opportunities = [
  { ref: "OPP-0418", title: "Session guitarist — gospel album", kind: "Session", matches: 6, shortlisted: 2, status: "Shortlisted" },
  { ref: "OPP-0417", title: "Afro-house producer — brand campaign", kind: "Sync brief", matches: 4, shortlisted: 3, status: "Client review" },
  { ref: "OPP-0415", title: "Backing vocalists — live residency", kind: "Live", matches: 9, shortlisted: 0, status: "Matched" },
  { ref: "OPP-0412", title: "String arrangement — film trailer", kind: "Production", matches: 3, shortlisted: 1, status: "Open" },
];

export const matchSuggestions = [
  { creative: "Granite Hour (sample)", fit: 92, reasons: "Role, genre, remote set-up, verified rights record", status: "Shortlisted" },
  { creative: "Lowveld Keys (sample)", fit: 74, reasons: "Genre and remote; secondary instrument", status: "Matched" },
  { creative: "Red Earth Rhythm (sample)", fit: 41, reasons: "In-studio only — excluded for remote brief", status: "Declined" },
];

export const clients = [
  { name: fictional("Example Records"), type: "Label", country: "Zimbabwe", projects: 3, contacts: 2, source: "Project brief", basis: "Respond to request" },
  { name: fictional("Northbound Films"), type: "Film, TV or games", country: "United Kingdom", projects: 1, contacts: 3, source: "Referral", basis: "Contract" },
  { name: fictional("Lantern Agency"), type: "Agency or brand", country: "South Africa", projects: 2, contacts: 1, source: "Project brief", basis: "Respond to request" },
  { name: fictional("Coastline Games"), type: "Film, TV or games", country: "Kenya", projects: 1, contacts: 2, source: "Event", basis: "Contract" },
  { name: "Independent artist (Tendai Placeholder)", type: "Independent artist", country: "Zimbabwe", projects: 1, contacts: 1, source: "Project brief", basis: "Respond to request" },
];

export const consentSummary = { contacts: 412, marketable: 138, transactionalOnly: 261, suppressed: 9, withdrawn: 4 };

export const consentRecords = [
  { contact: "Rudo Example", purpose: "Privacy notice", version: "2026-10-draft-1", source: "Project brief", recorded: "31 Oct 2026", status: "Granted" },
  { contact: "Rudo Example", purpose: "Marketing", version: "2026-10-mc-1", source: "Project brief", recorded: "31 Oct 2026", status: "Granted" },
  { contact: "Kofi Sample", purpose: "Privacy notice", version: "2026-10-draft-1", source: "Project brief", recorded: "30 Oct 2026", status: "Granted" },
  { contact: "Ama Demo", purpose: "Marketing", version: "2026-10-mc-1", source: "Newsletter", recorded: "02 Sep 2026", status: "Withdrawn" },
  { contact: "Sipho Example", purpose: "Marketing", version: "2026-10-mc-1", source: "Unsubscribe link", recorded: "14 Oct 2026", status: "Suppressed" },
];

export const duplicateCandidates = [
  { primary: "rudo@example.com", duplicate: "Rudo@Example.com ", rule: "Normalised email match", action: "Merged automatically" },
  { primary: "kofi.sample@example.com", duplicate: "Phone ending ••00 (masked)", rule: "Shared phone, different email", action: "Needs review" },
];

export const talentDirectory = [
  { name: "Msasa Room (sample)", roles: "Producer, songwriter", country: "Zimbabwe", verification: "Verified", rights: "Current", projects: 4 },
  { name: "Kopje Sound (sample)", roles: "Mix and mastering engineer", country: "Zimbabwe", verification: "Verified", rights: "Current", projects: 6 },
  { name: "Copper & Dusk (sample)", roles: "Vocalists, songwriters", country: "South Africa", verification: "In review", rights: "Awaiting evidence", projects: 1 },
  { name: "Nine Rivers Strings (sample)", roles: "Strings, composer", country: "Kenya", verification: "Verification", rights: "Current", projects: 0 },
  { name: "Tide & Thread (sample)", roles: "Songwriter, composer", country: "Nigeria", verification: "Pending", rights: "Not started", projects: 0 },
];

export const verificationBoard = [
  { title: "Received", items: [{ id: "v1", title: "Application APP-9QK2", meta: "Producer · Harare" }, { id: "v2", title: "Application APP-9QJ7", meta: "Vocalist · Lusaka" }] },
  { title: "Portfolio review", items: [{ id: "v3", title: "Tide & Thread (sample)", meta: "3 links submitted" }] },
  { title: "Identity & rights", items: [{ id: "v4", title: "Copper & Dusk (sample)", meta: "Rights evidence requested", status: "Awaiting evidence" }, { id: "v5", title: "Nine Rivers Strings (sample)", meta: "Identity check in progress" }] },
  { title: "Engagement terms", items: [{ id: "v6", title: "Application APP-9PZ1", meta: "Terms sent 29 Oct", status: "Awaiting signature" }] },
  { title: "Verified this month", items: [{ id: "v7", title: "Kopje Sound (sample)", meta: "Verified 03 Oct", status: "Verified" }] },
];

export const projects = [
  { ref: "PRJ-0142", name: "Debut EP — demonstration project", client: fictional("Example Records"), stage: "Mixing", milestones: [3, 5] as const, due: "28 Nov", lead: "Project manager (demo)", health: "Active" },
  { ref: "PRJ-0139", name: "Trailer score", client: fictional("Northbound Films"), stage: "Composition", milestones: [1, 4] as const, due: "12 Dec", lead: "Ops lead (demo)", health: "Active" },
  { ref: "PRJ-0137", name: "Campaign track and cut-downs", client: fictional("Lantern Agency"), stage: "Client review", milestones: [2, 3] as const, due: "06 Nov", lead: "Project manager (demo)", health: "Changes requested" },
  { ref: "PRJ-0131", name: "Game soundtrack — act one", client: fictional("Coastline Games"), stage: "Mastering", milestones: [4, 5] as const, due: "15 Nov", lead: "Ops lead (demo)", health: "Active" },
  { ref: "PRJ-0126", name: "Single — production and mix", client: "Independent artist (Tendai Placeholder)", stage: "Delivered", milestones: [4, 4] as const, due: "—", lead: "Project manager (demo)", health: "Complete" },
];

export const taskBoard = [
  { title: "To do", items: [{ id: "t1", title: "Book string session", meta: "PRJ-0139 · due 08 Nov" }, { id: "t2", title: "Send split sheet for signature", meta: "PRJ-0142 · due 04 Nov" }] },
  { title: "In progress", items: [{ id: "t3", title: "Mix v2 — track 3", meta: "PRJ-0142 · Kopje Sound (sample)" }, { id: "t4", title: "Theme sketches", meta: "PRJ-0139 · Tide & Thread (sample)" }] },
  { title: "Client review", items: [{ id: "t5", title: "60s master + cut-downs", meta: "PRJ-0137", status: "Changes requested" }] },
  { title: "Done", items: [{ id: "t6", title: "Stems delivered", meta: "PRJ-0126", status: "Delivered" }, { id: "t7", title: "Deposit received", meta: "PRJ-0142", status: "Paid" }] },
];

export const milestones = [
  { date: "02 Oct", title: "Brief signed off and deposit received", done: true },
  { date: "16 Oct", title: "Pre-production and arrangements approved", done: true },
  { date: "30 Oct", title: "Tracking complete — split sheet drafted", done: true },
  { date: "14 Nov", title: "Mix v2 for client review", detail: "Contracted revision round 1 of 2", status: "In progress" },
  { date: "28 Nov", title: "Masters, stems and final invoice", status: "Scheduled" },
];

export const deliverables = [
  { file: "PRJ-0142_T3_mix_v2.wav", version: "v2", visibility: "Private · signed link", scan: "Clean", approval: "Awaiting approval" },
  { file: "PRJ-0142_T1_master.wav", version: "v1", visibility: "Private · signed link", scan: "Clean", approval: "Approved" },
  { file: "PRJ-0137_campaign_60s.wav", version: "v3", visibility: "Private · signed link", scan: "Clean", approval: "Changes requested" },
  { file: "Client reference — moodboard.pdf", version: "v1", visibility: "Private · signed link", scan: "Scanning", approval: "—" },
];

export const contracts = [
  { ref: "CTR-0142-C", title: "Client services agreement", project: "PRJ-0142", parties: "Company ↔ Example Records (fictional)", version: "v2", status: "Signed", date: "02 Oct" },
  { ref: "CTR-0142-E1", title: "Creative engagement — production", project: "PRJ-0142", parties: "Company ↔ Msasa Room (sample)", version: "v1", status: "Signed", date: "03 Oct" },
  { ref: "CTR-0142-S", title: "Split sheet — track 3", project: "PRJ-0142", parties: "3 contributors", version: "v1", status: "Partially signed", date: "30 Oct" },
  { ref: "CTR-0139-C", title: "Composition and licence agreement", project: "PRJ-0139", parties: "Company ↔ Northbound Films (fictional)", version: "v3", status: "Awaiting signature", date: "29 Oct" },
  { ref: "CTR-NDA-21", title: "Mutual NDA", project: "—", parties: "Company ↔ Coastline Games (fictional)", version: "v1", status: "Draft", date: "—" },
];

export const splitSheetTrack3 = [
  { party: "Msasa Room (sample) — composition", bps: 4000 },
  { party: "Copper & Dusk (sample) — topline and lyrics", bps: 4000 },
  { party: "Granite Hour (sample) — guitar motif", bps: 2000 },
];
export const splitSheetTrack3Check = validateSplitSheet(splitSheetTrack3);

// ── Finance ─────────────────────────────────────────────────────────────

export const quotes = [
  { ref: "QUO-0144", client: fictional("Lantern Agency"), version: "v2", amount: usd(7800), status: "Sent", date: "29 Oct" },
  { ref: "QUO-0143", client: "Independent artist (Tendai Placeholder)", version: "v1", amount: usd(2200), status: "Accepted", date: "25 Oct" },
  { ref: "QUO-0141", client: fictional("Northbound Films"), version: "v3", amount: usd(18500), status: "Accepted", date: "22 Oct" },
];

export const invoices = [
  { ref: "INV-0311", client: fictional("Example Records"), project: "PRJ-0142", issued: "02 Oct", due: "09 Oct", amount: usd(2400), status: "Paid" },
  { ref: "INV-0318", client: fictional("Example Records"), project: "PRJ-0142", issued: "30 Oct", due: "13 Nov", amount: usd(2400), status: "Issued" },
  { ref: "INV-0316", client: fictional("Coastline Games"), project: "PRJ-0131", issued: "20 Oct", due: "27 Oct", amount: usd(6250), status: "Overdue" },
  { ref: "INV-0309", client: fictional("Northbound Films"), project: "PRJ-0139", issued: "24 Sep", due: "08 Oct", amount: usd(7400), status: "Paid" },
];

export const payments = [
  { ref: "PAY-0520", provider: "Bank transfer", providerRef: "DEMO-TX-88214", currency: "USD", amount: usd(2400), fee: usd(12), fx: "—", status: "Reconciled" },
  { ref: "PAY-0519", provider: "Card processor", providerRef: "DEMO-CH-55120", currency: "GBP → USD", amount: usd(7400), fee: usd(214), fx: "1 GBP = 1.27 USD (demo)", status: "Reconciled" },
  { ref: "PAY-0517", provider: "Mobile money", providerRef: "DEMO-MM-10933", currency: "USD", amount: usd(350), fee: usd(4), fx: "—", status: "Unreconciled" },
];

export const commissionConfigs: { contract: string; model: CommissionModel; label: string }[] = [
  { contract: "CTR-0142-C", model: { kind: "percentage", bps: 2000 }, label: "Managed project — 20% of net (illustrative)" },
  { contract: "CTR-0139-C", model: { kind: "fixed-margin", amount: usd(3000) }, label: "Fixed production margin — USD 3,000 (illustrative)" },
  { contract: "CTR-0127-C", model: { kind: "introduction-fee", amount: usd(400) }, label: "Introduction fee — USD 400 (illustrative)" },
];

export const approvedCosts = [
  { ref: "EXP-0201", project: "PRJ-0142", description: "Studio hire — tracking day", amount: usd(350), status: "Approved" },
  { ref: "EXP-0202", project: "PRJ-0142", description: "Session drummer fee (pass-through)", amount: usd(400), status: "Approved" },
  { ref: "EXP-0205", project: "PRJ-0137", description: "Courier — physical master", amount: usd(60), status: "Pending" },
];

/** Worked example: computed with the real settlement engine (src/domain/settlement.ts). */
export const settlementInput = {
  currency: "USD" as const,
  receipts: [usd(2400), usd(2400), usd(1200)],
  approvedCosts: [usd(350), usd(400)],
  commission: { kind: "percentage", bps: 2000 } as CommissionModel,
  participants: [
    { creativeId: "Msasa Room (sample)", weight: 50 },
    { creativeId: "Copper & Dusk (sample)", weight: 30 },
    { creativeId: "Granite Hour (sample)", weight: 20 },
  ],
};
export const settlementExample = settleProject(settlementInput);

export const payoutsDue = [
  { ref: "PST-0142-1", creative: "Msasa Room (sample)", project: "PRJ-0142", amount: settlementExample.payouts[0]!.amount, schedule: "On final approval", status: "Scheduled" },
  { ref: "PST-0131-2", creative: "Kopje Sound (sample)", project: "PRJ-0131", amount: usd(1150), schedule: "Net 7 after receipt", status: "Pending" },
  { ref: "PST-0126-1", creative: "Lowveld Keys (sample)", project: "PRJ-0126", amount: usd(640), schedule: "Paid 21 Oct", status: "Paid" },
];

export const cashflow = {
  categories: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
  receipts: [4200, 6800, 5100, 9400, 11200, 9850],
  payouts: [2900, 4700, 3600, 6500, 7900, 6800],
};

export const receivables = sum(
  invoices.filter((i) => i.status !== "Paid").map((i) => i.amount),
  "USD",
);

// ── Analytics ───────────────────────────────────────────────────────────

export const traffic = {
  categories: ["W32", "W33", "W34", "W35", "W36", "W37", "W38", "W39", "W40", "W41", "W42", "W43"],
  sessions: [610, 640, 702, 688, 760, 815, 790, 860, 930, 1010, 980, 1090],
  profileViews: [180, 210, 240, 236, 270, 300, 288, 330, 352, 390, 380, 425],
};

export const topPages = [
  { label: "/roster", value: 2140 },
  { label: "/", value: 1960 },
  { label: "/services", value: 980 },
  { label: "/contact", value: 760 },
  { label: "/artist-business-suite", value: 540 },
];

export const sources = [
  { label: "Direct", value: 38 },
  { label: "Search", value: 24 },
  { label: "Social (campaign-tagged)", value: 21 },
  { label: "Partner referral", value: 11 },
  { label: "Other referrers", value: 6 },
];

export const funnel = [
  { label: "Brief started", value: 214 },
  { label: "Brief submitted", value: 96 },
  { label: "Qualified", value: 41 },
  { label: "Quoted", value: 22 },
  { label: "Won", value: 13 },
];

// ── Partners ────────────────────────────────────────────────────────────

export const partnerReferralStatus = [
  { label: "Referred", value: 18 },
  { label: "Onboarded", value: 12 },
  { label: "Profile verified", value: 9 },
  { label: "Booked at least once", value: 6 },
];

export const partnerReferralsTable = [
  { cohort: "Q3 2026 cohort", referred: 11, onboarded: 8, verified: 6, booked: 4, consent: "9 of 11 consented to impact reporting" },
  { cohort: "Q4 2026 cohort (to date)", referred: 7, onboarded: 4, verified: 3, booked: 2, consent: "6 of 7 consented to impact reporting" },
];

// ── Admin ───────────────────────────────────────────────────────────────

export const staff = [
  { name: "Owner (demo)", email: "owner@example.com", role: "platform_owner" as const, mfa: "Enabled", lastActive: "Today" },
  { name: "Ops lead (demo)", email: "ops@example.com", role: "operations_manager" as const, mfa: "Enabled", lastActive: "Today" },
  { name: "Finance (demo)", email: "finance@example.com", role: "finance_operator" as const, mfa: "Enabled", lastActive: "Yesterday" },
  { name: "Roster manager (demo)", email: "roster@example.com", role: "talent_manager" as const, mfa: "Not enabled", lastActive: "29 Oct" },
  { name: "External auditor (demo)", email: "audit@example.com", role: "auditor" as const, mfa: "Enabled", lastActive: "02 Oct" },
];

export const auditLog = [
  { at: "31 Oct 09:14", actor: "Public form", action: "enquiry.received", entity: "ENQ-7K2QM9", detail: "Turnstile verified · privacy v2026-10-draft-1" },
  { at: "30 Oct 16:02", actor: "Finance (demo)", action: "invoice.issued", entity: "INV-0318", detail: "MFA step-up verified" },
  { at: "30 Oct 11:40", actor: "Ops lead (demo)", action: "contract.sent", entity: "CTR-0142-S", detail: "3 signatories" },
  { at: "29 Oct 18:22", actor: "Roster manager (demo)", action: "talent.verification.requested", entity: "Copper & Dusk (sample)", detail: "Rights evidence" },
  { at: "29 Oct 10:05", actor: "Owner (demo)", action: "staff.role.changed", entity: "Roster manager (demo)", detail: "auditor → talent_manager" },
  { at: "28 Oct 08:47", actor: "System", action: "consent.withdrawn", entity: "Ama Demo", detail: "Unsubscribe link · marketing suppressed" },
];
