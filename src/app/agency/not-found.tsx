import { Footer } from "@/platform/components/site/Footer";
import { Header } from "@/platform/components/site/Header";
import { PageHero } from "@/platform/components/site/blocks";
import { ButtonLink } from "@/platform/components/ui/primitives";
import "@/platform/styles/site.css";

// Unknown sample profiles and demo sections end up here; the public chrome is
// included directly because this renders outside the (site) group.
export default function AgencyNotFound() {
  return (
    <>
      <Header />
      <main id="main">
        <PageHero
          eyebrow="404"
          title={
            <>
              This page is <em>off the record.</em>
            </>
          }
          lede="The page you were looking for does not exist or has moved."
        >
          <div className="cluster">
            <ButtonLink href="/">Back to the platform home</ButtonLink>
            <ButtonLink href="/roster" variant="glass">
              Explore the roster
            </ButtonLink>
          </div>
        </PageHero>
      </main>
      <Footer />
    </>
  );
}
