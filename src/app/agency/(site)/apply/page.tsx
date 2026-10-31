import type { Metadata } from "next";
import { ApplicationForm } from "@/platform/components/forms/ApplicationForm";
import { PageHero } from "@/platform/components/site/blocks";
import { Checklist } from "@/platform/components/ui/primitives";

export const metadata: Metadata = {
  title: "Apply to the roster",
  description: "Producers, engineers, writers, musicians and vocalists: apply to join the verified network.",
};

export default function ApplyPage() {
  return (
    <>
      <PageHero
        eyebrow="Roster application"
        title={
          <>
            Join the <em>network.</em>
          </>
        }
        lede="Tell us about your work. The roster team listens to every application, and nothing about you is published until you approve your profile."
      />
      <section className="section" style={{ paddingTop: 0 }} aria-label="Roster application form">
        <div className="container form-layout">
          <ApplicationForm />
          <aside className="form-aside stack" style={{ ["--stack-gap" as string]: "1rem" }} aria-label="How applications work">
            <div className="aside-card">
              <h2>How it works</h2>
              <Checklist
                items={[
                  "We review your work and application",
                  "We verify identity, credits and rights",
                  "You approve your public profile and media",
                  "You receive matched opportunities in your workspace",
                ]}
              />
            </div>
            <div className="aside-card">
              <h2>Your rights</h2>
              <p>Applying is free and non-exclusive. Commission is set per contract and shown to you before you accept any work.</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
