import type { ReactNode } from "react";
import { brand } from "@/platform/config/brand";
import { PageHero } from "./blocks";
import { Notice } from "@/platform/components/ui/primitives";

export function LegalPage({ title, version, children }: { title: string; version: string; children: ReactNode }) {
  return (
    <>
      <PageHero eyebrow={`Legal · Version ${version}`} title={title} />
      <section className="section" style={{ paddingTop: 0 }} aria-label={title}>
        <div className="container container--narrow stack" style={{ ["--stack-gap" as string]: "2.5rem" }}>
          <Notice kind="proposed" title="Draft for legal review.">
            This text describes how the platform is designed to work. It must be reviewed by a qualified lawyer, and the operating entity
            {brand.legalEntity ? ` (${brand.legalEntity})` : " (to be confirmed)"} inserted, before launch.
          </Notice>
          <div className="prose">{children}</div>
        </div>
      </section>
    </>
  );
}
