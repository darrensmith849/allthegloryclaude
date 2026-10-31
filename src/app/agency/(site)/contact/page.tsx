import type { Metadata } from "next";
import { Suspense } from "react";
import { publicEnv } from "@/platform/config/public-env";
import { BriefForm, BriefFormFromUrl } from "@/platform/components/forms/BriefForm";
import { PageHero } from "@/platform/components/site/blocks";
import { Checklist } from "@/platform/components/ui/primitives";

export const metadata: Metadata = {
  title: "Start a project brief",
  description: "Tell us what you are making. A project lead will review your brief and come back with the right people and a written scope.",
};

export default function ContactPage() {
  const whatsapp = publicEnv.contactWhatsapp;
  return (
    <>
      <PageHero
        eyebrow="Contact and project brief"
        title={
          <>
            Let’s make <em>something.</em>
          </>
        }
        lede="Tell us a little about the project. Every brief is read by a person, and every project is different, so pricing is a conversation after scoping."
      />
      <section className="section" style={{ paddingTop: 0 }} aria-label="Project brief form">
        <div className="container form-layout">
          <Suspense fallback={<BriefForm />}>
            <BriefFormFromUrl />
          </Suspense>
          <aside className="form-aside stack" style={{ ["--stack-gap" as string]: "1rem" }} aria-label="What happens next">
            <div className="aside-card">
              <h2>What happens next</h2>
              <Checklist
                items={[
                  "A project lead reviews your brief",
                  "We ask anything we need to scope it",
                  "You receive matched creatives and a written scope",
                  "A fixed quote follows once the work is defined",
                ]}
              />
            </div>
            <div className="aside-card">
              <h2>Prefer to talk?</h2>
              {publicEnv.contactEmail || whatsapp ? (
                <ul role="list" className="stack" style={{ ["--stack-gap" as string]: "0.5rem" }}>
                  {publicEnv.contactEmail ? (
                    <li>
                      Email: <a href={`mailto:${publicEnv.contactEmail}`}>{publicEnv.contactEmail}</a>
                    </li>
                  ) : null}
                  {whatsapp ? (
                    <li>
                      WhatsApp:{" "}
                      <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                        {whatsapp}
                      </a>
                    </li>
                  ) : null}
                </ul>
              ) : (
                <p>Direct contact channels will be published at launch. Until then, the brief form is the fastest way to reach a project lead.</p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
