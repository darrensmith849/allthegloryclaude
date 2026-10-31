import type { Metadata } from "next";
import { brand } from "@/platform/config/brand";
import { partnerAssociations, partnerDisplayName } from "@/platform/config/approvals";
import { CtaBand, PageHero } from "@/platform/components/site/blocks";
import { Checklist, Eyebrow, Notice, SectionHead } from "@/platform/components/ui/primitives";

const partnerName = partnerDisplayName(partnerAssociations.artsSupportPartner, "an arts-support partner");

export const metadata: Metadata = {
  title: "Proposed collaboration vision",
  description: "How an arts-support partner and the platform could work together. A proposal, not a confirmed partnership.",
  // Proposals are not indexed until an agreement is in place.
  robots: { index: false, follow: false },
};

const division = [
  ["Commercial opportunities", "Artist advocacy"],
  ["Production and project delivery", "Holistic wellness"],
  ["Technology and dashboards", "Member-support network"],
  ["Contracts, invoices and payouts", "Business support and training"],
  ["International talent matching", "Professional-service referrals"],
  ["Artist websites and analytics", "Membership and collective impact"],
];

export default function ProposedCollaborationPage() {
  return (
    <>
      <PageHero
        eyebrow="Partner programme · Collaboration vision"
        title={
          <>
            Commercial strength and artist care, <em>side by side.</em>
          </>
        }
        lede={`A proposed model for how ${brand.name} and ${partnerName} could combine paid work and professional infrastructure with advocacy, wellness and member support.`}
        aside={
          <Notice kind="proposed" title="Proposed — not a confirmed partnership.">
            No agreement exists. The organisation is not named until it approves public association in writing, and nothing here implies endorsement.
          </Notice>
        }
      />

      <section className="section section--rule" aria-labelledby="division-h">
        <div className="container">
          <SectionHead index="01" eyebrow="Proposed division of value" title={<span id="division-h">Each side does what it does best.</span>} />
          <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="division-h">
            <table className="table">
              <caption className="visually-hidden">Proposed division of responsibilities</caption>
              <thead>
                <tr>
                  <th scope="col">Platform company</th>
                  <th scope="col">Arts-support partner (proposed)</th>
                </tr>
              </thead>
              <tbody>
                {division.map(([a, b]) => (
                  <tr key={a}>
                    <td>{a}</td>
                    <td>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section section--night" aria-labelledby="passport-h">
        <div className="container two-col two-col--even">
          <div className="stack" style={{ ["--stack-gap" as string]: "1.25rem" }}>
            <Eyebrow index="02">Possible joint programme</Eyebrow>
            <h2 id="passport-h" style={{ fontSize: "var(--step-4)" }}>
              The Artist Business Passport
            </h2>
            <p className="lede">A single, consent-controlled record that helps an artist get booked, paid, supported and funded.</p>
          </div>
          <Checklist
            items={[
              "Verified professional profile",
              "Digital portfolio and press kit",
              "Contracts, rights and earnings history",
              "Availability and skills directory",
              "Training and funding-readiness records",
              "Membership and support referrals",
              "Opportunity matching",
              "Analytics and impact reporting",
            ]}
          />
        </div>
      </section>

      <section className="section" aria-labelledby="module-h">
        <div className="container two-col">
          <div className="stack sticky-col" style={{ ["--stack-gap" as string]: "1.25rem" }}>
            <Eyebrow index="03">Partner module</Eyebrow>
            <h2 id="module-h" style={{ fontSize: "var(--step-4)" }}>
              What the platform would provide
            </h2>
          </div>
          <div className="grid grid--2">
            <article className="card">
              <h3>For members</h3>
              <Checklist items={["Membership referral and status", "Benefits and programme directory", "Training and events", "Opportunity and funding notices"]} />
            </article>
            <article className="card">
              <h3>For the partner</h3>
              <Checklist items={["Legal, wellness and financial-professional referrals", "Support-request status (never case detail)", "Consent and document history", "Partner impact reporting"]} />
            </article>
          </div>
        </div>
      </section>

      <section className="section section--raised" aria-labelledby="confirm-h">
        <div className="container container--narrow">
          <SectionHead index="04" eyebrow="Before anything is public" title={<span id="confirm-h">What must be confirmed first</span>} />
          <Checklist
            items={[
              "The correct contracting entity and its active services",
              "Eligibility across South Africa, Zimbabwe and the wider continent",
              "Regulated providers for legal, wellness and financial referrals",
              "Data-protection responsibilities on each side",
              "Branding permissions and approved wording",
              "Commercial terms",
            ]}
          />
        </div>
      </section>

      <CtaBand title="Represent an arts-support organisation?" body="We would welcome the conversation." primary={{ href: "/contact?service=not-sure", label: "Get in touch" }} />
    </>
  );
}
