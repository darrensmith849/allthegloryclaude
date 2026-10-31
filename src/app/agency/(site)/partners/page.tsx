import type { Metadata } from "next";
import { CtaBand, PageHero } from "@/platform/components/site/blocks";
import { Icon, type IconName } from "@/platform/components/ui/Icon";
import { ArrowLink, ButtonLink, Checklist, Eyebrow, SectionHead } from "@/platform/components/ui/primitives";

export const metadata: Metadata = {
  title: "Partner programme",
  description: "For arts-support organisations, studios, labels, educators and funders who want to widen access to paid work for African creatives.",
};

const partnerTypes: { icon: IconName; title: string; body: string }[] = [
  { icon: "heart", title: "Arts-support organisations", body: "Advocacy, wellness and member-support networks that want their artists to reach paid work and professional infrastructure." },
  { icon: "mic", title: "Studios and production houses", body: "Facilities across the continent that can host sessions and share capacity with the network." },
  { icon: "briefcase", title: "Labels, publishers and agencies", body: "Teams that commission African talent and need contracting, rights and delivery handled properly." },
  { icon: "spark", title: "Educators and training providers", body: "Programmes that build business readiness, technical skills and professional standards." },
  { icon: "wallet", title: "Funders and development programmes", body: "Organisations that need trustworthy impact reporting on jobs, earnings and outcomes." },
];

export default function PartnersPage() {
  return (
    <>
      <PageHero
        eyebrow="Partner programme"
        title={
          <>
            Widen access, <em>together.</em>
          </>
        }
        lede="Partners bring artists, programmes and opportunities. The platform brings commercial work, contracts, payments, technology and reporting — with each artist’s consent at the centre."
        aside={
          <div className="cluster">
            <ButtonLink href="/contact?service=not-sure" icon="arrow-right">
              Talk to us about partnering
            </ButtonLink>
            <ArrowLink href="/demo/partner/overview">See the partner workspace</ArrowLink>
          </div>
        }
      />

      <section className="section section--rule" aria-labelledby="who-h">
        <div className="container">
          <SectionHead index="01" eyebrow="Who we partner with" title={<span id="who-h">Organisations that share the mission.</span>} />
          <div className="grid grid--3">
            {partnerTypes.map((p) => (
              <article className="card" key={p.title}>
                <span className="icon-dot">
                  <Icon name={p.icon} />
                </span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--raised" aria-labelledby="workspace-h">
        <div className="container two-col">
          <div className="stack sticky-col" style={{ ["--stack-gap" as string]: "1.25rem" }}>
            <Eyebrow index="02">Partner workspace</Eyebrow>
            <h2 id="workspace-h" style={{ fontSize: "var(--step-4)" }}>
              Everything a partner needs. Nothing it should not see.
            </h2>
            <p className="lede">Authorised partner operators get a workspace of their own, scoped by artist consent.</p>
          </div>
          <div className="grid grid--2">
            <article className="card">
              <h3>What partners see</h3>
              <Checklist items={["Referred artists and their programme status", "Membership and benefits", "Authorised support-workflow status", "Opportunities and training", "Aggregated employment and income impact"]} />
            </article>
            <article className="card">
              <h3>What partners never see</h3>
              <Checklist items={["Commercial terms of other projects", "Medical, psychological, legal or financial case detail", "Any artist record without that artist’s consent", "Marketing lists or contact data beyond the referral"]} />
            </article>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="vision-h">
        <div className="container container--narrow">
          <div className="card" style={{ gap: "1.25rem" }}>
            <span className="badge badge--proposed">Proposed — not confirmed</span>
            <h2 id="vision-h" style={{ fontSize: "var(--step-3)" }}>
              A proposed collaboration with an artist-support organisation
            </h2>
            <p>
              We have set out how a pan-African arts-support partner and this platform could divide the work — and a joint Artist Business Passport
              programme. It is a proposal, not an agreement.
            </p>
            <div>
              <ArrowLink href="/partners/proposed-collaboration">Read the collaboration vision</ArrowLink>
            </div>
          </div>
        </div>
      </section>

      <CtaBand title="Let’s build the network together." body="Tell us about your organisation and the artists you serve." primary={{ href: "/contact?service=not-sure", label: "Start a conversation" }} />
    </>
  );
}
