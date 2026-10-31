import type { Metadata } from "next";
import { CtaBand, Faq, PageHero } from "@/platform/components/site/blocks";
import { ArrowLink, ButtonLink, Eyebrow, SectionHead } from "@/platform/components/ui/primitives";

export const metadata: Metadata = {
  title: "For creatives",
  description: "Producers, engineers, writers, musicians and vocalists: paid work, professional tools and transparent payouts.",
};

export default function CreativesPage() {
  return (
    <>
      <PageHero
        eyebrow="For creatives"
        title={
          <>
            Paid work, professional tools <em>and a fair record.</em>
          </>
        }
        lede="Get found by clients worldwide, get contracted properly, and see exactly how every project pays you — from a workspace that is yours."
        aside={
          <div className="cluster">
            <ButtonLink href="/apply" icon="arrow-right">
              Apply to the roster
            </ButtonLink>
            <ArrowLink href="/artist-business-suite">The Artist Business Suite</ArrowLink>
          </div>
        }
      />

      <section className="section section--rule" aria-labelledby="who-h">
        <div className="container">
          <SectionHead index="01" eyebrow="Who we are looking for" title={<span id="who-h">Professionals at every stage.</span>}>
            Producers, mix and mastering engineers, recording engineers, songwriters, composers, vocalists, instrumentalists and musical directors — from
            Zimbabwe, across Africa and the diaspora.
          </SectionHead>
          <div className="grid grid--3">
            <article className="card">
              <h3>Get found</h3>
              <p>A verified profile with your roles, styles, languages and working modes, discoverable by clients and matched to opportunities.</p>
            </article>
            <article className="card">
              <h3>Get contracted properly</h3>
              <p>Every booking comes with written terms, your fee, your split and your credit — agreed before work starts.</p>
            </article>
            <article className="card">
              <h3>Get paid transparently</h3>
              <p>Payout statements show what the client paid, approved costs, the commission and your share, line by line.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--raised" aria-labelledby="verify-h">
        <div className="container two-col">
          <div className="stack sticky-col" style={{ ["--stack-gap" as string]: "1.25rem" }}>
            <Eyebrow index="02">Verification</Eyebrow>
            <h2 id="verify-h" style={{ fontSize: "var(--step-4)" }}>
              How joining works
            </h2>
            <p className="lede">We verify every creative before they are listed, so clients can trust the roster and your profile carries weight.</p>
          </div>
          <ol className="flow" role="list">
            {[
              ["Apply", "Share your roles, styles and links to your work."],
              ["Review", "The roster team listens and reviews your application."],
              ["Verify", "We confirm identity, credits and rights to the work you share."],
              ["Approve your listing", "You approve your public profile and media before anything is published."],
              ["Get matched", "Receive opportunities and bookings in your workspace."],
            ].map(([t, d]) => (
              <li key={t}>
                <strong>{t}</strong>
                <span>{d}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="faq-h">
        <div className="container container--narrow">
          <SectionHead eyebrow="Creative questions" title={<span id="faq-h">Before you apply</span>} />
          <Faq
            items={[
              { q: "Does it cost anything to apply?", a: "No. Applying and being listed are free. Commission terms are set out per contract before you accept any work." },
              { q: "Do I keep my rights?", a: "Your rights are what your contract and split sheet say — agreed in writing before work starts, never assumed." },
              { q: "Can I work remotely?", a: "Yes. Most work is remote-first. Tell us about your recording set-up in the application." },
              { q: "Is this exclusive?", a: "No. Joining the network does not stop you working elsewhere." },
            ]}
          />
        </div>
      </section>

      <CtaBand title="Your next session is waiting." body="Applications are reviewed by the roster team." primary={{ href: "/apply", label: "Apply to the roster" }} secondary={{ href: "/opportunities", label: "See opportunity types" }} />
    </>
  );
}
