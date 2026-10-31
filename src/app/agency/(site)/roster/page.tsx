import type { Metadata } from "next";
import { Suspense } from "react";
import { sampleRoster } from "@/platform/demo-data/roster";
import { RosterExplorer } from "@/platform/components/roster/RosterExplorer";
import { TalentCard } from "@/platform/components/roster/TalentCard";
import { CtaBand, PageHero } from "@/platform/components/site/blocks";
import { Notice } from "@/platform/components/ui/primitives";

export const metadata: Metadata = {
  title: "Roster",
  description: "Discover producers, engineers, writers, musicians and vocalists from across Africa. Profiles shown before launch are fictional samples.",
};

export default function RosterPage() {
  return (
    <>
      <PageHero
        eyebrow="Roster discovery"
        title={
          <>
            Find the right creative, <em>then hear them first.</em>
          </>
        }
        lede="Filter by role, style and where people work from. Every filtered view is a shareable link, and one shared player keeps listening out of your way."
        aside={
          <Notice kind="sample" title="Launch roster in verification.">
            Profiles here are fictional samples that demonstrate the experience. Real creatives appear only after verification and their written
            approval to be listed.
          </Notice>
        }
      />
      <section className="section" style={{ paddingTop: 0 }} aria-label="Roster">
        <div className="container">
          <Suspense
            fallback={
              <div>
                <div className="roster-toolbar" aria-hidden="true" style={{ minHeight: 168 }} />
                <div className="roster-grid">
                  {sampleRoster.map((p) => (
                    <TalentCard key={p.slug} profile={p} headingLevel={2} />
                  ))}
                </div>
              </div>
            }
          >
            <RosterExplorer profiles={sampleRoster} />
          </Suspense>
        </div>
      </section>
      <CtaBand
        title="Not sure who you need?"
        body="Send the brief instead. We match from the full verified network, not just the profiles you can see."
        primary={{ href: "/contact", label: "Start a project brief" }}
        secondary={{ href: "/apply", label: "Apply to the roster" }}
      />
    </>
  );
}
