import type { Metadata } from "next";
import { brand } from "@/platform/config/brand";
import { LegalPage } from "@/platform/components/site/LegalPage";

export const metadata: Metadata = { title: "Privacy notice", description: `How ${brand.name} collects, uses and protects personal information.` };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy notice" version={brand.policyVersions.privacy}>
      <p>
        This notice explains what personal information {brand.name} collects through this website and platform, why, and the choices you have. We
        aim to comply with South Africa’s Protection of Personal Information Act (POPIA), Zimbabwe’s Cyber and Data Protection Act, and, where they
        apply, the UK and EU GDPR.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Project briefs:</strong> your name, email, optional phone and organisation, location, the services you are interested in, your budget
          range and timeline, your brief and any reference links.
        </li>
        <li>
          <strong>Roster applications:</strong> your name, optional stage name, contact details, location, roles, genres, experience, links to your
          work, credits and statement.
        </li>
        <li>
          <strong>Consent records:</strong> the wording version you agreed to, when, and through which form.
        </li>
        <li>
          <strong>Anonymous usage data:</strong> pages viewed, approved media played and form submissions, recorded without cookies and with a random
          per-tab identifier. We do not record what you type into a form before you submit it, your precise location or your IP address.
        </li>
      </ul>
      <h2>Why we use it</h2>
      <ul>
        <li>To respond to your brief or application and take the next steps you asked for.</li>
        <li>To scope, contract, deliver and account for projects you choose to go ahead with.</li>
        <li>To protect the website from abuse (bot checks and rate limits).</li>
        <li>To understand, in aggregate, which pages and services are useful.</li>
        <li>
          To send you news <strong>only if you ticked the separate marketing box</strong>. Submitting a brief or application never adds you to
          marketing.
        </li>
      </ul>
      <h2>Who processes it</h2>
      <p>
        The website runs on Cloudflare (content delivery, security and bot protection through Turnstile). Business records will be stored in a private
        database hosted with Hetzner in the European Union, with encrypted backups. Email delivery and payment providers will be listed here once
        selected. We do not sell personal information.
      </p>
      <h2>How long we keep it</h2>
      <p>
        Briefs and applications that do not lead to work are deleted or anonymised after 24 months unless you ask us to keep them. Contract and
        financial records are kept for as long as the law requires. Marketing consent lasts until you withdraw it.
      </p>
      <h2>Your rights</h2>
      <p>
        You can ask to see, correct, export or delete your information, object to its use, and withdraw marketing consent at any time. Sensitive
        support matters handled with partner organisations are never shown in our general dashboards; only an authorised status is shared, and only
        with your consent.
      </p>
      <h2>Contact</h2>
      <p>
        A data-protection contact address will be published here before launch. You may also complain to the Information Regulator (South Africa),
        POTRAZ (Zimbabwe) or your local authority.
      </p>
    </LegalPage>
  );
}
