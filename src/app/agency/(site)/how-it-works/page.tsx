import type { Metadata } from "next";
import { moneyFlow, projectSteps } from "@/platform/content/offer";
import { CtaBand, Faq, PageHero } from "@/platform/components/site/blocks";
import { Checklist, Eyebrow, SectionHead } from "@/platform/components/ui/primitives";

export const metadata: Metadata = {
  title: "How projects work",
  description: "Brief, match, create, deliver — with written scopes, fixed quotes, split sheets, milestone payments and transparent payout statements.",
};

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How projects work"
        title={
          <>
            One accountable team, <em>from brief to payout.</em>
          </>
        }
        lede="We manage the project and the client relationship. That means one contract for the client, clear terms for every creative, and money that moves on the record."
      />

      <section className="section section--rule" aria-labelledby="steps-h">
        <div className="container">
          <SectionHead index="01" eyebrow="The four stages" title={<span id="steps-h">Brief, match, create, deliver.</span>} />
          <ol className="steps" role="list">
            {projectSteps.map((s, i) => (
              <li className="step" key={s.title}>
                <span className="step__num">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--raised" aria-labelledby="money-h">
        <div className="container two-col">
          <div className="stack sticky-col" style={{ ["--stack-gap" as string]: "1.25rem" }}>
            <Eyebrow index="02">Contracts and money</Eyebrow>
            <h2 id="money-h" style={{ fontSize: "var(--step-4)" }}>
              Ten steps, all on the record.
            </h2>
            <p className="lede">
              Clients pay the company, not individuals. Commission is set per contract and shown to the creative. Every payout comes with a
              statement that reconciles to the cent.
            </p>
          </div>
          <ol className="flow" role="list">
            {moneyFlow.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                <span>{step.detail}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="rights-h">
        <div className="container">
          <SectionHead index="03" eyebrow="Rights, revisions and changes" title={<span id="rights-h">The details that protect everyone.</span>} />
          <div className="grid grid--3">
            <article className="card">
              <h3>Split sheets first</h3>
              <p>Every contributor’s writing and master shares are agreed and signed before release. Shares must total exactly 100 %.</p>
            </article>
            <article className="card">
              <h3>Contracted revisions</h3>
              <p>Each milestone includes an agreed number of revision rounds. Anything beyond scope becomes a written change request with its own quote.</p>
            </article>
            <article className="card">
              <h3>Disputes handled early</h3>
              <p>Disagreements are logged against the milestone and resolved with both parties before money moves — never by withholding files.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--sunk" aria-labelledby="remote-h">
        <div className="container two-col two-col--even">
          <div className="stack" style={{ ["--stack-gap" as string]: "1.25rem" }}>
            <Eyebrow index="04">Remote-first</Eyebrow>
            <h2 id="remote-h" style={{ fontSize: "var(--step-4)" }}>
              Recorded in Harare, mixed in Bulawayo, approved in London.
            </h2>
          </div>
          <Checklist
            items={[
              "Session tempo, key and reference tracks agreed before recording",
              "Private, versioned file exchange — no public links to unreleased music",
              "Time-zone-aware milestones and review windows",
              "Delivery to your technical specification: stems, versions, loudness",
            ]}
          />
        </div>
      </section>

      <section className="section" aria-labelledby="faq-h">
        <div className="container container--narrow">
          <SectionHead eyebrow="Questions" title={<span id="faq-h">Frequently asked</span>} />
          <Faq
            items={[
              { q: "Do you publish prices?", a: "Not yet. Every brief receives a written, fixed quote after scoping. Published rate cards will follow once approved." },
              { q: "Can I hire a creative directly?", a: "Requests go through the company so that contracts, rights and payments are handled properly for both sides." },
              { q: "Who owns the music?", a: "Ownership and licensing are set out in each contract and split sheet. We never assume rights that were not agreed in writing." },
              { q: "How are creatives paid?", a: "On the contracted schedule after client payment, with a statement showing receipts, approved costs, commission and their share." },
              { q: "Which currencies do you work in?", a: "Quotes state their currency. Cross-border tax, exchange and payment processes are being finalised with accountants before launch." },
            ]}
          />
        </div>
      </section>

      <CtaBand title="Ready when you are." body="Start with a brief. You will hear back from a project lead, not an automated queue." primary={{ href: "/contact", label: "Start a project brief" }} />
    </>
  );
}
