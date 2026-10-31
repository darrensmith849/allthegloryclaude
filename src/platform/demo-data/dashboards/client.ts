import { applyBasisPoints, sum } from "@/platform/domain/money";
import { fictional, usd } from "./shared";

// DEMONSTRATION DATA — client portal for a fictional label and project.

export const clientName = fictional("Example Records");
export const projectName = "Debut EP — demonstration project";
export const projectRef = "PRJ-0142";

export const quoteLines = [
  { item: "Pre-production and arrangement — 4 tracks", amount: usd(1200) },
  { item: "Production — 4 tracks", amount: usd(2000) },
  { item: "Session players (guitar, keys, drums)", amount: usd(900) },
  { item: "Mixing — 4 tracks, 2 contracted revision rounds", amount: usd(1200) },
  { item: "Mastering — streaming and vinyl pre-master", amount: usd(400) },
  { item: "Split-sheet administration", amount: usd(300) },
];
export const quoteTotal = sum(quoteLines.map((l) => l.amount), "USD");

/** Payment schedule in basis points of the quote: 40 / 40 / 20. */
export const schedule = [
  { label: "Deposit on signature", bps: 4000, due: "02 Oct", status: "Paid" },
  { label: "Milestone — tracking complete", bps: 4000, due: "13 Nov", status: "Issued" },
  { label: "Final — on delivery approval", bps: 2000, due: "On approval", status: "Scheduled" },
].map((s) => ({ ...s, amount: applyBasisPoints(quoteTotal, s.bps) }));

export const scheduleCheck = schedule.reduce((a, s) => a + s.bps, 0) === 10_000;

export const invoices = [
  { ref: "INV-0311", description: "Deposit (40%)", issued: "02 Oct", due: "09 Oct", amount: schedule[0]!.amount, status: "Paid" },
  { ref: "INV-0318", description: "Milestone — tracking complete (40%)", issued: "30 Oct", due: "13 Nov", amount: schedule[1]!.amount, status: "Issued" },
];

export const receipts = [{ ref: "RCT-0311", invoice: "INV-0311", received: "04 Oct", method: "Bank transfer (demo)", amount: schedule[0]!.amount }];

export const agreements = [
  { ref: "CTR-0142-C", title: "Client services agreement", version: "v2", status: "Signed", date: "02 Oct" },
  { ref: "CTR-0142-L", title: "Master and licence terms", version: "v1", status: "Signed", date: "02 Oct" },
  { ref: "CTR-0142-X1", title: "Change request — add vinyl pre-master", version: "v1", status: "Awaiting signature", date: "29 Oct" },
];

export const briefVersions = [
  { version: "v3", date: "06 Oct", change: "Added vinyl pre-master to deliverables", by: "Client" },
  { version: "v2", date: "28 Sep", change: "Track list confirmed after discovery call", by: "Project lead (demo)" },
  { version: "v1", date: "21 Sep", change: "Submitted through the website brief form", by: "Client" },
];

export const brief = {
  summary:
    "A four-track debut EP blending Afropop and gospel influences, with live guitar and keys, aimed at streaming release in early 2027 and a limited vinyl run.",
  services: ["Production and arrangement", "Session musicians", "Mixing", "Mastering"],
  budget: "USD 5,000 – 15,000",
  timeline: "6 – 12 weeks",
  references: ["Reference playlist (private link)", "Moodboard PDF (uploaded)"],
};

export const drafts = [
  { ref: "DRF-T1-M1", title: "Track 1 — master v1", milestone: "Masters", submitted: "22 Oct", status: "Approved" },
  { ref: "DRF-T3-MX2", title: "Track 3 — mix v2", milestone: "Mixes", submitted: "30 Oct", status: "Awaiting approval" },
  { ref: "DRF-T2-MX1", title: "Track 2 — mix v1", milestone: "Mixes", submitted: "27 Oct", status: "Changes requested" },
];

export const revisions = { contracted: 2, used: 1 };

export const revisionRequests = [
  { ref: "REV-021", draft: "Track 2 — mix v1", request: "Lift lead vocal in the second chorus; less reverb on the snare.", raised: "28 Oct", status: "In progress" },
];

export const milestoneApprovals = [
  { date: "16 Oct", title: "Arrangements approved", done: true },
  { date: "30 Oct", title: "Tracking complete", done: true },
  { date: "14 Nov", title: "Mixes approved", status: "Awaiting approval" },
  { date: "28 Nov", title: "Masters and stems delivered", status: "Scheduled" },
];

export const referenceFiles = [
  { name: "Moodboard.pdf", size: "4.2 MB", uploaded: "21 Sep", scan: "Clean", access: "Private · signed link" },
  { name: "Lyric sheet — track 3.docx", size: "38 KB", uploaded: "02 Oct", scan: "Clean", access: "Private · signed link" },
  { name: "Vocal guide — track 4.wav", size: "61 MB", uploaded: "31 Oct", scan: "Scanning", access: "Private · signed link" },
];

export const finalFiles = [
  { name: "Track 1 — master (WAV 24-bit/48k)", status: "Approved", available: "On final payment" },
  { name: "Track 1 — stems (8)", status: "Approved", available: "On final payment" },
  { name: "Tracks 2–4 — masters and stems", status: "In progress", available: "After approval" },
];

export const messages = [
  { from: "Project lead (demo)", own: false, at: "30 Oct · 16:10", body: "Mix v2 of track 3 is up for review. This uses your first contracted revision round — the notes we applied are listed on the draft." },
  { from: "You", own: true, at: "30 Oct · 18:42", body: "Thank you — listening tonight. Could we also hear a version with the guitar motif a little louder in the intro?" },
  { from: "Project lead (demo)", own: false, at: "31 Oct · 08:05", body: "Yes. That fits inside the current round, so there is no change request needed. We will add it to the same revision." },
];
