// FICTIONAL EXAMPLE OPPORTUNITIES — illustrate the opportunity network before
// real listings exist. No client, fee or deadline here is real.

export interface SampleOpportunity {
  id: string;
  title: string;
  kind: "Session" | "Production" | "Sync brief" | "Live" | "Collaboration" | "Programme";
  roles: string[];
  location: string;
  remote: boolean;
  timing: string;
  summary: string;
}

export const sampleOpportunities: SampleOpportunity[] = [
  {
    id: "opp-s1",
    title: "Session guitarist for a gospel album",
    kind: "Session",
    roles: ["Guitarist"],
    location: "Remote",
    remote: true,
    timing: "Example timing: 3 weeks",
    summary: "Clean and overdriven parts across six songs, recorded to the producer's session and delivered as labelled stems.",
  },
  {
    id: "opp-s2",
    title: "Afro-house producer for a brand campaign",
    kind: "Sync brief",
    roles: ["Producer", "Mix engineer"],
    location: "Remote · client in Europe",
    remote: true,
    timing: "Example timing: 2 weeks",
    summary: "A 60-second bespoke track with 30- and 15-second cut-downs. Buy-out terms and splits agreed before work begins.",
  },
  {
    id: "opp-s3",
    title: "Backing vocalists for a live residency",
    kind: "Live",
    roles: ["Vocalist"],
    location: "Harare",
    remote: false,
    timing: "Example timing: monthly",
    summary: "Two harmony vocalists for a recurring live show. Rehearsal schedule, fees and travel set out in the booking agreement.",
  },
  {
    id: "opp-s4",
    title: "Co-writers for a pan-African songwriting camp",
    kind: "Collaboration",
    roles: ["Songwriter", "Producer"],
    location: "Hybrid",
    remote: true,
    timing: "Example timing: 5 days",
    summary: "Small writing rooms pairing writers and producers across countries, with split sheets signed at the end of each day.",
  },
  {
    id: "opp-s5",
    title: "Business-readiness programme for independent artists",
    kind: "Programme",
    roles: ["All creatives"],
    location: "Online",
    remote: true,
    timing: "Example timing: 6 sessions",
    summary: "Contracts, invoicing, rights and funding readiness — the training component of the proposed Artist Business Passport.",
  },
];
