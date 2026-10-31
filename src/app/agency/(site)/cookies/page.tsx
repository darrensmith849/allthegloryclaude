import type { Metadata } from "next";
import { brand } from "@/platform/config/brand";
import { LegalPage } from "@/platform/components/site/LegalPage";

export const metadata: Metadata = { title: "Cookies", description: `How ${brand.name} uses cookies and similar technologies.` };

export default function CookiesPage() {
  return (
    <LegalPage title="Cookies" version={brand.policyVersions.privacy}>
      <p>The public website is designed to work without advertising, tracking or analytics cookies, so there is no cookie banner to dismiss.</p>
      <h2>What we use</h2>
      <ul>
        <li>
          <strong>Session storage for anonymous analytics:</strong> a random identifier that lasts only while the browser tab is open. It is never
          shared with third parties and is not set when your browser sends Global Privacy Control or Do Not Track.
        </li>
        <li>
          <strong>Cloudflare security:</strong> Cloudflare may set strictly necessary cookies to protect the site from attacks and to run the
          Turnstile bot check on forms.
        </li>
        <li>
          <strong>Signed-in platform (from Phase 2):</strong> a secure, HTTP-only session cookie that keeps you signed in. It is strictly necessary
          and contains no tracking information.
        </li>
      </ul>
      <h2>Third-party content</h2>
      <p>Embedded players from streaming services are not loaded until you choose to play them, and this page will list them once they are used.</p>
    </LegalPage>
  );
}
