import type { Metadata } from "next";
import { brand } from "@/platform/config/brand";
import { LegalPage } from "@/platform/components/site/LegalPage";

export const metadata: Metadata = { title: "Terms", description: `Terms of use for the ${brand.name} website and platform.` };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" version={brand.policyVersions.terms}>
      <h2>About these terms</h2>
      <p>
        These terms cover your use of this website. Projects, bookings and roster membership are governed by separate written agreements, which take
        precedence for that work.
      </p>
      <h2>Demonstration content</h2>
      <p>
        Before launch, roster profiles, opportunities and dashboards on this site are <strong>fictional samples</strong>. They do not represent real
        people, prices, availability, credits or partnerships, and nothing on the site is an offer capable of acceptance.
      </p>
      <h2>Submissions</h2>
      <p>
        When you send a brief or application you confirm the information is accurate and that you have the right to share any work you link to. A
        submission does not create a contract or an obligation on either side.
      </p>
      <h2>Intellectual property</h2>
      <p>
        Music, media and materials shared with us remain yours. We use them only to review your submission or deliver contracted work. Rights in
        project work are set out in each contract and split sheet.
      </p>
      <h2>Acceptable use</h2>
      <p>Do not attempt to disrupt the site, bypass its security, submit automated or misleading content, or misuse other people’s information.</p>
      <h2>Liability</h2>
      <p>
        The website is provided as is. To the extent the law allows, we are not liable for indirect losses arising from its use. Nothing in these
        terms limits rights you have under consumer-protection law.
      </p>
      <h2>Governing law</h2>
      <p>The governing law and jurisdiction will be confirmed with the operating entity before launch.</p>
    </LegalPage>
  );
}
