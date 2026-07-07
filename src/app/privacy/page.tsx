import Link from "next/link";

// Plain-English privacy policy, specific to what this site actually does
// (contact form + newsletter via Web3Forms, donations via Paystack, light
// first-party analytics, Cloudflare hosting, YouTube embeds). Not legal
// advice — review before relying on it.

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl md:text-2xl text-white">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-white/70">
        {children}
      </div>
    </section>
  );
}

const ext =
  "text-[var(--colour-amber)]/85 hover:text-[var(--colour-amber)] underline decoration-white/20 underline-offset-4 transition-colors";

export default function PrivacyPage() {
  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-3xl px-6 pt-32 md:pt-40 pb-20 md:pb-28">
        <header className="text-center">
          <div className="eyebrow">Legal</div>
          <h1 className="font-display mt-4 text-4xl md:text-6xl font-normal text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-white/55">Last updated: 7 July 2026</p>
        </header>

        <div className="mt-10 md:mt-14 panel-scrim panel-flush-mobile p-7 md:p-10 space-y-9">
          <p className="text-[15px] leading-relaxed text-white/75">
            All The Glory is the music and ministry of Daniel Jenkins, a
            project under the Kingdom Come Foundation. This page explains what
            personal information this website (alltheglory.co.za) collects, why,
            and the choices you have. We&rsquo;ve kept it short and honest.
          </p>

          <Section title="What we collect">
            <ul className="list-disc pl-5 space-y-2 marker:text-[var(--colour-amber)]/60">
              <li>
                <strong className="text-white/85">When you contact us or
                subscribe</strong> — your name (if you give it), email address
                and message, so we can reply or send the occasional update you
                asked for.
              </li>
              <li>
                <strong className="text-white/85">When you donate</strong> —
                your payment is handled securely by our payment provider,
                Paystack. We never see or store your card details. We keep a
                record of the gift (amount, date and email) to account for
                donations received.
              </li>
              <li>
                <strong className="text-white/85">When you visit</strong> —
                light, privacy‑minded analytics: pages viewed, approximate
                country and an anonymous session identifier, to understand how
                the site is used. Our host (Cloudflare) also processes your IP
                address to deliver and protect the site.
              </li>
            </ul>
          </Section>

          <Section title="Why we collect it">
            <p>
              To reply to you, send updates you asked for, process and account
              for donations, keep the site secure, and see which pages are
              helpful. Nothing more &mdash; we don&rsquo;t sell your
              information or use it for advertising.
            </p>
          </Section>

          <Section title="Who we share it with">
            <p>
              We use a small number of trusted providers to run the site. Each
              handles only what it needs and under its own privacy policy:
            </p>
            <ul className="list-disc pl-5 space-y-2 marker:text-[var(--colour-amber)]/60">
              <li>
                <a href="https://web3forms.com/privacy-policy" target="_blank" rel="noopener noreferrer" className={ext}>Web3Forms</a>{" "}
                &mdash; delivers contact‑form and newsletter submissions to our
                inbox.
              </li>
              <li>
                <a href="https://paystack.com/terms" target="_blank" rel="noopener noreferrer" className={ext}>Paystack</a>{" "}
                &mdash; securely processes donations.
              </li>
              <li>
                <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className={ext}>Cloudflare</a>{" "}
                &mdash; hosting, security and content delivery (processes IP
                addresses).
              </li>
              <li>
                <strong className="text-white/85">Our email host</strong>{" "}
                &mdash; stores the email we receive.
              </li>
              <li>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className={ext}>YouTube</a>{" "}
                &mdash; video embeds on the Videos page, in privacy‑enhanced
                mode.
              </li>
            </ul>
          </Section>

          <Section title="Cookies & tracking">
            <p>
              This site uses very little. There&rsquo;s no advertising and no
              third‑party ad trackers. Our own analytics use an anonymous
              session identifier rather than advertising cookies, and embedded
              YouTube videos load in privacy‑enhanced mode.
            </p>
          </Section>

          <Section title="How long we keep it">
            <p>
              We keep contact messages and donation records for as long as we
              need them for the purposes above, and analytics for a limited
              period. You can ask us to delete your information at any time.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              You can ask us to access, correct or delete the personal
              information we hold about you, or to stop sending you updates.
              Under South Africa&rsquo;s POPIA and, where it applies, the EU/UK
              GDPR, you have these rights and may complain to the relevant
              regulator.
            </p>
          </Section>

          <Section title="Children">
            <p>
              This site isn&rsquo;t directed at children, and we don&rsquo;t
              knowingly collect information from anyone under 18.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              For any privacy request or question, email{" "}
              <a href="mailto:daniel@alltheglory.co.za" className={ext}>daniel@alltheglory.co.za</a>{" "}
              or use the{" "}
              <Link href="/contact" className={ext}>Contact page</Link>.
            </p>
          </Section>

          <Section title="Changes">
            <p>
              We may update this policy from time to time; the date at the top
              shows the latest version.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}
