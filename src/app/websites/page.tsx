import ProcessSteps from "@/components/ui/process-steps";
import FAQ from "@/components/ui/faq";
import { CONTACT, PROJECTS, type Project } from "./projects";
import { CopyEmail, Reveal } from "./motion";

// /websites - Daniel's page for selling the websites he builds. It wears
// the All The Glory look - the sky backdrop, Fraunces headings, amber
// accents, glass panels, the same step cards and question list as
// /commissions - but stands alone as a share link: the album nav, footer,
// socials and player are hidden here (see components/site/*).
//
// The sites he has built show as cards with their own logo glowing in the
// site's brand colour, linking out to the live site. No screenshots or
// previews, and no prices - pricing is a private conversation.

const SERVICES = [
  { title: "Business websites", body: "A polished home for your company: who you are, what you offer, and an easy way for customers to reach you." },
  { title: "Personal & artist sites", body: "For musicians, creatives and professionals who want to be found, heard and remembered." },
  { title: "Churches & ministries", body: "Share your message, your events and ways to give, in a place that feels like home." },
  { title: "Property & listings", body: "Searchable listings with photos, prices and enquiry buttons that send leads straight to you." },
  { title: "Launch pages", body: "One focused, beautiful page for a product, an event or a campaign." },
  { title: "Website refresh", body: "Already have a site that's showing its age? I'll redesign it and bring it up to date." },
];

const INCLUDED = [
  "Custom design, made just for you",
  "Looks right on phones, tablets and computers",
  "Set up on your own web address",
  "WhatsApp, email and contact buttons",
  "Ready for Google, with proper titles and descriptions",
  "Smart link previews on WhatsApp and social media",
  "Fast and secure as standard",
  "Help after launch - I'm a message away",
];

const STEPS = [
  { title: "Let's talk", body: "Message me on WhatsApp or email. Tell me about you, your work and what you'd love your website to do." },
  { title: "Design", body: "I design your site around your story and the people you want to reach, and share it with you as it takes shape." },
  { title: "Build & refine", body: "I build it from scratch, and we refine it together until it feels exactly right." },
  { title: "Launch", body: "Your site goes live on your own web address, ready to share with the world." },
];

const FAQS = [
  {
    q: "How much does a website cost?",
    a: "Every website is different, so pricing is a private conversation. Message me with what you need and I'll give you a clear, honest quote.",
  },
  {
    q: "How long does it take?",
    a: "It depends on the size of the site. We'll agree on a timeline together before any work begins.",
  },
  {
    q: "Do I need my own web address?",
    a: "If you don't have one yet, I'll help you choose one and get it set up.",
  },
  {
    q: "What do you need from me to start?",
    a: "A short chat about you and your work, plus any logo, photos and wording you already have. If you don't have those yet, we'll work it out together.",
  },
  {
    q: "Will it work on phones?",
    a: "Yes. Every site is designed to look and work beautifully on phones, tablets and computers.",
  },
  {
    q: "Can you help after the site is live?",
    a: "Yes. If something needs changing after launch, just send me a message.",
  },
];

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.01c0-5.2 4.24-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.7 5.8.7 12.07c0 2 .52 3.95 1.52 5.67L.6 23.65l6.05-1.59a11.3 11.3 0 0 0 5.4 1.38h.01c6.26 0 11.35-5.09 11.36-11.35 0-3.03-1.18-5.89-3.33-8.03" />
    </svg>
  );
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SectionHead({ eyebrow, title, accent, body }: { eyebrow: string; title: string; accent?: string; body?: string }) {
  return (
    <Reveal className="mb-10 text-center md:mb-14">
      <div className="eyebrow eyebrow-amber">{eyebrow}</div>
      <h2 className="font-display mt-3 text-3xl font-normal tracking-tight text-white md:text-5xl">
        {title}
        {accent && (
          <>
            {" "}
            <span className="italic text-[var(--colour-amber)]">{accent}</span>
          </>
        )}
      </h2>
      {body && <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/65 md:text-base">{body}</p>}
    </Reveal>
  );
}

function WorkCard({ p, i, big }: { p: Project; i: number; big: boolean }) {
  const inner = (
    <>
      <div className={`ws-plate ${big ? "aspect-[16/8]" : "aspect-[16/10]"}`}>
        <span className="eyebrow absolute left-5 top-5">{String(i + 1).padStart(2, "0")}</span>
        <span className="absolute right-5 top-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
          <span className={`h-1.5 w-1.5 rounded-full ${p.url ? "bg-emerald-400" : "bg-[var(--colour-amber)]"}`} />
          {p.url ? "Live" : "Coming soon"}
        </span>
        <span className={`ws-logo ${big ? "ws-logo-lg" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.logo} alt={`${p.name} logo`} />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <div className="eyebrow eyebrow-amber">{p.kind}</div>
        <h3 className="font-display mt-3 text-2xl tracking-tight text-white md:text-[1.75rem]">{p.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/65 md:text-[15px]">{p.blurb}</p>
        <div className="mt-auto pt-6">
          <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-5">
            <span className="truncate text-xs text-white/40">{p.url ? p.host : "Launching soon"}</span>
            {p.url && (
              <span className="ws-visit shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--colour-amber)]">
                Visit site <span className="inline-block">↗</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
  const style = { "--c": p.color } as React.CSSProperties;
  return p.url ? (
    <a href={p.url} target="_blank" rel="noopener noreferrer" className="ws-card panel-scrim panel-flush-mobile" style={style} aria-label={`${p.name} - visit the site (opens in a new tab)`}>
      {inner}
    </a>
  ) : (
    <div className="ws-card panel-scrim panel-flush-mobile" style={style}>
      {inner}
    </div>
  );
}

export default function WebsitesPage() {
  return (
    <main className="relative overflow-x-clip bg-transparent">
      <style>{`
        .ws-card { display:flex; flex-direction:column; height:100%; overflow:hidden;
          transition: transform .5s cubic-bezier(.16,1,.3,1), border-color .5s, box-shadow .5s; }
        a.ws-card:hover { transform: translateY(-6px); border-color: color-mix(in srgb, var(--c) 45%, transparent);
          box-shadow: 0 40px 90px rgba(0,0,0,.45), 0 30px 90px -30px color-mix(in srgb, var(--c) 60%, transparent); }
        .ws-plate { position:relative; display:grid; place-items:center; overflow:hidden; border-bottom:1px solid rgba(255,255,255,.08);
          background:
            radial-gradient(60% 85% at 50% 100%, color-mix(in srgb, var(--c) 38%, transparent), transparent 72%),
            radial-gradient(50% 60% at 50% 0%, rgba(241,215,166,.08), transparent 70%),
            linear-gradient(180deg, rgba(255,255,255,.02), rgba(0,0,0,.28)); }
        .ws-plate::before { content:""; position:absolute; inset:-40%; pointer-events:none; opacity:.55;
          background: repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,.05) 0 1px, transparent 1px 46px);
          -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 0%, transparent 55%); mask-image: radial-gradient(circle at 50% 50%, #000 0%, transparent 55%); }
        .ws-logo { position:relative; display:grid; place-items:center; width: clamp(88px, 22%, 112px); aspect-ratio:1; border-radius:26px;
          background: rgba(9,8,14,.6); border:1px solid rgba(255,255,255,.14);
          box-shadow: 0 24px 60px rgba(0,0,0,.55), 0 0 70px -6px color-mix(in srgb, var(--c) 55%, transparent);
          transition: transform .6s cubic-bezier(.16,1,.3,1), box-shadow .6s; }
        .ws-logo-lg { width: clamp(96px, 20%, 132px); border-radius:30px; }
        .ws-logo img { width:64%; height:64%; object-fit:contain; border-radius:14px; }
        .ws-logo img[src*="logo-dove"] { width:92%; height:92%; }
        a.ws-card:hover .ws-logo { transform: translateY(-4px) scale(1.06); box-shadow: 0 30px 70px rgba(0,0,0,.6), 0 0 110px 0 color-mix(in srgb, var(--c) 60%, transparent); }
        .ws-visit span { transition: transform .35s cubic-bezier(.16,1,.3,1); }
        a.ws-card:hover .ws-visit span { transform: translate(3px,-3px); }
        .ws-service { transition: border-color .4s, transform .5s cubic-bezier(.16,1,.3,1); }
        .ws-service:hover { border-color: rgba(216,178,90,.35); transform: translateY(-3px); }
        .ws-wa { display:inline-flex; align-items:center; gap:10px; }
      `}</style>

      {/* ───────── Top bar ───────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-colour-bg/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6" style={{ paddingInline: "var(--page-pad)", height: "var(--header-height)" }}>
          <a href="#top" className="flex items-baseline gap-3">
            <span className="font-display text-[18px] tracking-tight text-white/95">Daniel Jenkins</span>
            <span className="eyebrow hidden sm:inline">Websites</span>
          </a>
          <nav className="hidden items-center gap-8 lg:flex">
            {[
              ["#work", "Work"],
              ["#services", "Services"],
              ["#process", "Process"],
              ["#about", "About"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/55 transition-colors hover:text-white/90">
                {label}
              </a>
            ))}
          </nav>
          <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary !px-4 !py-2.5 !text-[11px]">
            Start a project
          </a>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section id="top" className="relative flex min-h-[100svh] flex-col items-center px-6 pb-12 pt-[calc(var(--header-height)+clamp(56px,11vh,120px))] text-center">
        <div className="flex flex-1 flex-col items-center justify-center">
          <Reveal>
            <div className="eyebrow eyebrow-amber">Web design &amp; development</div>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="font-display mt-6 max-w-[15ch] text-[clamp(2.8rem,7vw,6.4rem)] font-normal leading-[1.02] tracking-tight text-white [text-shadow:0_24px_90px_rgba(0,0,0,0.62)]">
              Websites that bring your vision <span className="italic text-[var(--colour-amber)]">to light.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
              I design and build beautiful, custom websites for companies, ministries and people - made from scratch, made
              for every screen, and launched on your own web address.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary ws-wa">
                <WhatsAppIcon />
                Start a project →
              </a>
              <a href="#work" className="btn btn-ghost">
                See my work
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.4} className="mt-16 w-full">
          <div className="eyebrow">Sites I&apos;ve built</div>
          <ul className="mx-auto mt-5 flex max-w-5xl flex-wrap items-center justify-center gap-x-9 gap-y-4">
            {PROJECTS.map((p) => (
              <li key={p.key} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.logo} alt="" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
                <span className="font-display text-[15px] text-white/70">{p.name}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* ───────── Work ───────── */}
      <section id="work" className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-16 md:py-24">
        <SectionHead
          eyebrow="Selected work"
          title="Sites I've"
          accent="built"
          body="Each one designed from a blank page, around the people it's for. Tap any site to visit it."
        />
        <div className="grid gap-5 md:grid-cols-6">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.key} delay={(i % 3) * 0.08} className={i < 2 ? "md:col-span-3" : "md:col-span-2"}>
              <WorkCard p={p} i={i} big={i < 2} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Services ───────── */}
      <section id="services" className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-16 md:py-24">
        <SectionHead
          eyebrow="What I build"
          title="A website for every kind of"
          accent="vision"
          body="Whether you're a business, a ministry or one person with something to share, your site is shaped around you."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {SERVICES.map((s, i) => (
            <Reveal key={s.title} delay={(i % 3) * 0.08}>
              <div className="ws-service panel-scrim panel-flush-mobile h-full p-7">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="text-lg text-[var(--colour-amber)]">✦</span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <h3 className="font-display mt-4 text-xl tracking-tight text-white md:text-2xl">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Every site includes */}
        <Reveal className="mt-5">
          <div className="panel-scrim panel-flush-mobile grid gap-10 p-8 md:grid-cols-[1fr_1.4fr] md:p-12">
            <div>
              <div className="eyebrow eyebrow-amber">Every website includes</div>
              <h3 className="font-display mt-3 text-2xl tracking-tight text-white md:text-4xl">
                Beautiful on the outside. <span className="italic text-[var(--colour-amber)]">Solid</span> underneath.
              </h3>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65 md:text-base">
                The things that make a website feel professional come as standard - no matter the size of the project.
              </p>
            </div>
            <ul className="grid content-center gap-x-8 gap-y-4 sm:grid-cols-2">
              {INCLUDED.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm leading-relaxed text-white/80 md:text-[15px]">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[rgba(216,178,90,0.4)] text-[var(--colour-amber)]">
                    <Check />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* ───────── Process ───────── */}
      <div id="process" className="scroll-mt-24">
        <ProcessSteps eyebrow="How it works" title="From first chat to launch day" steps={STEPS} />
      </div>

      {/* ───────── About ───────── */}
      <section id="about" className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-16 md:py-24">
        <Reveal>
          <div className="panel-scrim panel-flush-mobile grid items-center gap-10 overflow-hidden p-6 md:grid-cols-[0.9fr_1.1fr] md:gap-14 md:p-10">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/media/daniel-cafe.jpg" alt="Daniel Jenkins" className="h-full w-full object-cover object-[50%_30%]" loading="lazy" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
            <div>
              <div className="eyebrow eyebrow-amber">About me</div>
              <h2 className="font-display mt-3 text-3xl font-normal tracking-tight text-white md:text-5xl">
                Hi, I&apos;m <span className="italic text-[var(--colour-amber)]">Daniel.</span>
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/70 md:text-base">
                <p>
                  I&apos;m a singer-songwriter from Harare, Zimbabwe - and I build websites. That includes All The Glory, the
                  home of my own worship album and Bible study, and sites for a property agency, a marketing consultancy, a
                  Christian nonprofit and a music producer.
                </p>
                <p>
                  I care about the details: how your site looks, how it feels on a phone, and how easily people can reach
                  you. The aim is simple - a website you&apos;re proud to share.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary ws-wa">
                  <WhatsAppIcon />
                  Chat with me
                </a>
                <a href="#work" className="btn btn-ghost">
                  See my work
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────── FAQ ───────── */}
      <div id="faq" className="scroll-mt-24">
        <FAQ eyebrow="Frequently asked" title="Questions, answered" items={FAQS} />
      </div>

      {/* ───────── Contact ───────── */}
      <section id="contact" className="mx-auto w-full max-w-4xl scroll-mt-24 px-6 pb-20 pt-6 md:pb-28">
        <Reveal>
          <div className="panel-scrim panel-flush-mobile p-8 text-center md:p-14">
            <div className="eyebrow eyebrow-amber">Ready when you are</div>
            <h2 className="font-display mt-3 text-3xl font-normal tracking-tight text-white md:text-5xl">
              Let&apos;s build something <span className="italic text-[var(--colour-amber)]">beautiful.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-white/65 md:text-base">
              Every website is different, so pricing is a private conversation. Send me a message - tell me about your
              project and we&apos;ll take it from there.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary ws-wa">
                <WhatsAppIcon />
                Chat on WhatsApp
              </a>
              <a href={CONTACT.emailHref} className="btn btn-ghost">
                Send an email
              </a>
            </div>
            <div className="mx-auto mt-10 grid max-w-xl gap-6 border-t border-white/10 pt-8 text-left sm:grid-cols-2">
              <div>
                <div className="eyebrow">WhatsApp</div>
                <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="font-display mt-2 block text-xl text-white/90 transition-colors hover:text-[var(--colour-amber)]">
                  {CONTACT.whatsapp}
                </a>
              </div>
              <div className="min-w-0">
                <div className="eyebrow">Email</div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <a href={CONTACT.emailHref} className="font-display block break-all text-xl text-white/90 transition-colors hover:text-[var(--colour-amber)]">
                    {CONTACT.email}
                  </a>
                  <CopyEmail email={CONTACT.email} />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-white/5 bg-colour-bg/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-12 text-center">
          <p className="font-display text-lg italic text-white/75 md:text-xl">&ldquo;Whatever you do, work at it with all your heart.&rdquo;</p>
          <p className="eyebrow mt-3">Colossians 3:23</p>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 text-xs text-white/40 sm:flex-row">
            <span>© {new Date().getFullYear()} Daniel Jenkins · Websites</span>
            <a href="#top" className="uppercase tracking-[0.22em] transition-colors hover:text-white/80">
              Back to top ↑
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
