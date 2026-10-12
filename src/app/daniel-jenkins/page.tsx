import Image from "next/image";
import VideoReel, { type Reel } from "./video-reel";
import { CountUp, HeroImage, Reveal } from "./motion";
import Nav from "./nav";

// Daniel's personal resume page - a standalone share link that lives on the
// All The Glory domain. The site's nav, footer, socials and album player are
// hidden on /daniel-jenkins (see components/site/*). Fonts come from
// ./layout.tsx.
//
// Spacing system (see the <style> block): one page padding, one content
// width, one section rhythm and one column gap, all fluid with clamp().
// The nav, every section and the footer sit in the same .dj-wrap, so every
// element shares the same left and right rails at every screen size.

const CONTACT = {
  email: "danieljenkinsofficial@gmail.com",
  phone: "+263 78 829 1503",
  phoneHref: "tel:+263788291503",
  whatsapp: "+27 84 665 1423",
  whatsappHref: "https://wa.me/27846651423",
  youtube: "https://www.youtube.com/danieljenkins92",
};

// Baby Come Back leads; the rest follow in the index.
const REELS: Reel[] = [
  { id: "HG1sJOBo2ko", year: "2025", title: "Baby Come Back", note: "Player cover, recorded live" },
  { id: "do9D6ra6QT8", year: "2025", title: "Solo Live Showreel", note: "Solo set with lead guitar" },
  { id: "-LCMQwrVxMU", year: "2023", title: "Solo Promo", note: "Filmed at sea with Seabourn" },
  { id: "EdMA62ZW_E8", year: "2017", title: "Duo Performance", note: "Live in Dubai" },
  { id: "MPYOLi9gkoA", year: "2017", title: "Live Festival", note: "On stage in London" },
];

const STATS = [
  { to: 500, from: 0, suffix: "+", label: "Performances at sea" },
  { to: 30, from: 0, suffix: "+", label: "Countries" },
  { to: 5, from: 0, suffix: "", label: "Continents" },
  { to: 2013, from: 1990, suffix: "", label: "Performing since" },
];

const PERFORMANCE = [
  { when: "May 2024 – Sep 2024", place: "Seabourn Odyssey", role: "Lead guitarist / vocalist, trio", where: "Alaska, Japan" },
  { when: "Sep 2023 – Feb 2024", place: "Seabourn Odyssey", role: "Lead guitarist / vocalist, trio", where: "Alaska, Australia, New Zealand" },
  { when: "Oct 2022 – May 2023", place: "Seabourn Odyssey", role: "Lead guitarist / vocalist, trio", where: "Australia, French Polynesia, New Zealand" },
  { when: "Oct 2019 – Feb 2020", place: "Seabourn Quest", role: "Lead guitarist / vocalist, trio", where: "Antarctica, Canada, North & South America" },
  { when: "Oct 2017 – Jan 2018", place: "Kempinski Hotel, Ajman", role: "Lead guitarist / vocalist, duo", where: "United Arab Emirates" },
  { when: "Sep 2016 – Aug 2017", place: "Danat Al Ain Resort, Al Ain", role: "Lead guitarist / vocalist, quartet", where: "United Arab Emirates" },
  { when: "2015", place: "Circus Taverna", role: "Summer contract", where: "Greece" },
];

const BUSINESS = [
  { when: "Current", place: "2KO", role: "Executive Manager", where: "2ko.co.za", href: "https://2ko.co.za" },
  { when: "Ongoing", place: "All The Glory", role: "Founder & recording artist", where: "alltheglory.co.za", href: "/" },
  { when: "Previous", place: "Impart Global", role: "Co-Founder", where: "impart.global", href: "https://www.impart.global" },
];

const HIGHLIGHTS = [
  { tag: "2014", title: "Electric Vines Concert, Cape Town", text: "Solo supporting act alongside Jeremy Loops, Prime Circle, Matthew Mole and Goodluck." },
  { tag: "2015", title: "Opened for Prime Circle", text: "Supporting act for Prime Circle in Harare." },
  { tag: "Award", title: "Harare's Got Talent", text: "Third place." },
  { tag: "Radio", title: "Original music on air", text: "Songs played on South African and Zimbabwean radio stations." },
];

const SKILLS = ["Recording artist", "Singer & songwriter", "Lead guitarist", "Live performer", "Creative strategist", "Diploma in Hotel Management"];

const SEABOURN = [
  "Daniel has settled in extremely well to ship life. He is very popular not only with his colleagues in the Entertainment Department but with the guests also. An excellent team member and I wish him well for the rest of his contract.",
  "Daniel has been a great asset to the team as a member of the Club trio. He is a good musician, also adds to the vocal variety of the group. He has a good attitude, is dependable and willing to help at all times.",
  "Daniel is a very good performer, singer and guitarist. He is part of the Club Trio and consistently performs his role in a very professional manner. He is very friendly with both guests and crew, a true team player.",
];

// Three square photos shown whole (no cropping). The two small originals
// were cleaned and enlarged for sharp display; see public/media/daniel.
const GALLERY = [
  { src: "/media/daniel/gallery-red-door.webp", alt: "Daniel Jenkins at a red door with an acoustic guitar" },
  { src: "/media/daniel/gallery-stage.webp", alt: "Daniel Jenkins with his electric guitar before a show" },
  { src: "/media/daniel/gallery-rooftop.webp", alt: "Daniel Jenkins on a city rooftop" },
];

function SectionHead({ title, n, dark }: { title: string; n: string; dark?: boolean }) {
  return (
    <Reveal y={16}>
      <div className={`dj-head flex items-end justify-between border-b pb-5 ${dark ? "border-[var(--dj-dline)]" : "border-[var(--dj-line)]"}`}>
        <h2 className="dj-serif dj-h2">{title}</h2>
        <span className={`dj-mono pb-1.5 text-[11px] uppercase tracking-[0.15em] ${dark ? "text-[var(--dj-paper)]/50" : "text-[var(--dj-muted)]"}`}>{n}</span>
      </div>
    </Reveal>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`dj-mono text-[11px] uppercase tracking-[0.15em] text-[var(--dj-muted)] ${className}`}>{children}</p>;
}

function ExperienceTable({ rows }: { rows: { when: string; place: string; role: string; where: string; href?: string }[] }) {
  return (
    <ol className="border-t border-[var(--dj-ink)]">
      {rows.map((r, i) => {
        const external = r.href?.startsWith("http");
        const where = r.href ? (
          <a href={r.href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="underline decoration-[var(--dj-line)] underline-offset-4 transition-colors hover:text-[var(--dj-accent)] hover:decoration-current">
            {r.where}
          </a>
        ) : (
          r.where
        );
        return (
          <li key={i} className="grid gap-1 border-b border-[var(--dj-line)] py-[clamp(16px,1.6vw,22px)] md:grid-cols-[minmax(150px,1fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,1.4fr)] md:items-baseline md:gap-[var(--dj-col-gap-sm)]">
            <span className="dj-mono text-[12px] text-[var(--dj-muted)]">{r.when}</span>
            <span className="text-[1.05rem] font-medium tracking-[-0.01em] md:text-lg">{r.place}</span>
            <span className="text-[15px] text-[var(--dj-ink)]/75">{r.role}</span>
            <span className="text-[15px] text-[var(--dj-muted)] md:text-right">{where}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function DanielJenkinsPage() {
  return (
    <main className="dj relative min-h-screen overflow-x-clip bg-[var(--dj-bg)] text-[var(--dj-ink)]">
      <style>{`
        .dj {
          /* colour */
          --dj-bg:#ece5d9; --dj-ink:#181512; --dj-muted:#6f665c; --dj-line:rgba(24,21,18,.15);
          --dj-dark:#13110f; --dj-paper:#ece5d9; --dj-dline:rgba(236,229,217,.14);
          --dj-accent:#9a3220; --dj-accent-l:#d9774f;
          /* spacing system */
          --dj-page-pad: clamp(20px, 5vw, 88px);
          --dj-max: 1320px;
          --dj-header-h: clamp(64px, 7vh, 84px);
          --dj-section-y: clamp(72px, 9vw, 144px);
          --dj-head-gap: clamp(32px, 4.5vw, 64px);
          --dj-col-gap: clamp(28px, 5vw, 88px);
          --dj-col-gap-sm: clamp(16px, 2.4vw, 32px);
          --dj-hero-bottom: clamp(24px, 4.5vh, 56px);
          font-family: var(--dj-sans), system-ui, sans-serif;
          font-size: clamp(15px, 0.95vw + 0.5rem, 17px);
        }
        .dj ::selection { background: var(--dj-accent); color: #fff; }
        .dj-wrap { width: 100%; max-width: calc(var(--dj-max) + var(--dj-page-pad) * 2); margin-inline: auto; padding-inline: var(--dj-page-pad); }
        .dj-section { padding-block: var(--dj-section-y); }
        .dj-section-t { padding-top: var(--dj-section-y); }
        .dj-section-b { padding-bottom: var(--dj-section-y); }
        .dj-head { margin-bottom: var(--dj-head-gap); }
        .dj-gap { column-gap: var(--dj-col-gap); }
        .dj-h1 { font-size: clamp(3rem, 6.4vw, 6rem); line-height: .95; }
        .dj-h2 { font-size: clamp(2.3rem, 4.2vw, 3.6rem); line-height: 1; }
        .dj-lede { font-size: clamp(1.08rem, 1.3vw, 1.3rem); line-height: 1.65; }
        .dj-body { font-size: 1rem; line-height: 1.75; }
        .dj-serif { font-family: var(--dj-serif), Georgia, serif; font-weight: 400; letter-spacing: -0.01em; }
        .dj-mono { font-family: var(--dj-mono), ui-monospace, monospace; }
        .dj-eq i { display:block; width:2px; background:currentColor; animation: dj-eq .9s ease-in-out infinite; }
        .dj-eq i:nth-child(2){ animation-delay:.2s } .dj-eq i:nth-child(3){ animation-delay:.4s }
        @keyframes dj-eq { 0%,100%{height:30%} 50%{height:100%} }
        .dj-scroll { scrollbar-width: thin; scrollbar-color: rgba(236,229,217,.25) transparent; }
        .dj-scroll::-webkit-scrollbar { width:4px; } .dj-scroll::-webkit-scrollbar-thumb { background:rgba(236,229,217,.25); }
        .dj-bob { animation: dj-bob 2.2s ease-in-out infinite; }
        @keyframes dj-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
        @media (prefers-reduced-motion: reduce) { .dj-eq i, .dj-bob { animation: none; } }
      `}</style>

      <Nav />

      {/* ───────── Hero photo ───────── */}
      <section className="relative h-[72svh] min-h-[480px] overflow-hidden bg-[var(--dj-dark)] md:h-[min(90svh,980px)]">
        <HeroImage>
          <Image
            src="/media/daniel/hero.webp"
            alt="Daniel Jenkins sitting by a red door with his guitar"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[22%_45%] md:object-[50%_45%]"
          />
        </HeroImage>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/55 to-transparent" />
        {/* Bottom row on the page rails, same distance from the bottom edge */}
        <div className="absolute inset-x-0 bottom-[var(--dj-hero-bottom)]">
          <div className="dj-wrap dj-mono flex items-end justify-between text-[11px] uppercase tracking-[0.15em] text-[var(--dj-paper)]/80">
            <span>Harare, Zimbabwe</span>
            <a href="#intro" className="transition-colors hover:text-white">
              <span className="dj-bob inline-block">Scroll ↓</span>
            </a>
          </div>
        </div>
      </section>

      {/* ───────── Introduction ───────── */}
      <section id="intro" className="dj-section">
        <div className="dj-wrap">
          <div className="dj-gap grid gap-y-8 md:grid-cols-2 md:items-end">
            <Reveal>
              <h1 className="dj-serif dj-h1">Daniel Jenkins</h1>
              <Label className="mt-5 leading-relaxed">
                {["Recording artist", "Singer-songwriter", "Lead guitarist", "Live performer"].map((r, i) => (
                  <span key={r}>{i > 0 && " · "}<span className="whitespace-nowrap">{r}</span></span>
                ))}
              </Label>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="dj-lede text-[var(--dj-ink)]/85">
                Singer-songwriter and lead guitarist based in Harare, Zimbabwe. Over 500 performances at sea with Seabourn Cruise
                Line, contracts in Greece and the UAE, and supporting slots for some of South Africa&apos;s biggest artists.
                Currently Executive Manager at 2KO.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#showreels" className="dj-mono rounded-[3px] bg-[var(--dj-ink)] px-4 py-3 text-[11px] uppercase tracking-[0.14em] text-[var(--dj-paper)] transition-colors hover:bg-[var(--dj-accent)]">
                  Watch showreels
                </a>
                <a href="#contact" className="dj-mono rounded-[3px] border border-[var(--dj-ink)]/30 px-4 py-3 text-[11px] uppercase tracking-[0.14em] transition-colors hover:border-[var(--dj-ink)]">
                  Contact details
                </a>
              </div>
            </Reveal>
          </div>

          <dl className="dj-gap mt-[var(--dj-section-y)] grid grid-cols-2 gap-y-10 md:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.1} y={24}>
                <div className="border-t border-[var(--dj-ink)] pt-5">
                  <dd className="text-[clamp(2.4rem,4.6vw,4rem)] font-light leading-none tracking-[-0.04em]">
                    <CountUp to={s.to} from={s.from} suffix={s.suffix} />
                  </dd>
                  <dt className="dj-mono mt-3 text-[11px] uppercase tracking-[0.14em] text-[var(--dj-muted)]">{s.label}</dt>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* ───────── Showreels ───────── */}
      <section id="showreels" className="dj-section bg-[var(--dj-dark)] text-[var(--dj-paper)]">
        <div className="dj-wrap">
          <SectionHead title="Showreels" n="01" dark />
          <Reveal delay={0.05}>
            <VideoReel reels={REELS} />
          </Reveal>
          <p className="dj-mono mt-6 text-[11px] uppercase tracking-[0.14em] text-[var(--dj-paper)]/50">
            More on{" "}
            <a href={CONTACT.youtube} target="_blank" rel="noopener noreferrer" className="text-[var(--dj-paper)] underline underline-offset-4 hover:text-[var(--dj-accent-l)]">
              YouTube
            </a>
          </p>
        </div>
      </section>

      {/* ───────── About ───────── */}
      <section id="about" className="dj-section">
        <div className="dj-wrap">
          <SectionHead title="About" n="02" />
          <div className="dj-gap grid items-start gap-y-10 md:grid-cols-2">
            <Reveal className="md:sticky md:top-[calc(var(--dj-header-h)+24px)]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[4px] max-md:aspect-[4/4.2]">
                <Image src="/media/daniel/portrait.webp" alt="Daniel Jenkins" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-[60%_30%]" />
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="dj-body space-y-5 text-[var(--dj-ink)]/85">
                <p>
                  Daniel obtained a diploma in Hotel Management in Cape Town at the end of 2013 and has since pursued his dream of
                  becoming a singer-songwriter. He continues to write and release songs, some of which have been played on South
                  African and Zimbabwean radio.
                </p>
                <p>
                  He established himself quickly as a performer, playing hundreds of gigs in his first year across Cape Town,
                  Durban, Victoria Falls and Harare. In 2015 he spent a summer performing in Greece, followed by two years in the
                  UAE with a four-piece band at Danat Al Ain Resort and a duo at the Kempinski Hotel, Ajman.
                </p>
                <p>
                  Since 2019 he has performed with Seabourn Cruise Line as lead guitarist and vocalist in three different trios
                  over four contracts, with more than 500 performances at sea across 30+ countries on five continents. Between
                  contracts he performs as a solo artist at venues of every kind.
                </p>
                <p>
                  Daniel builds genuine, long-lasting relationships, and his marketing ability helps create experiences that keep
                  people engaged. He is organised, reliable and accurate with day-to-day operations.
                </p>
              </div>
              <div className="mt-10 grid gap-8 border-t border-[var(--dj-line)] pt-6 sm:grid-cols-2">
                <div>
                  <Label className="mb-4">Skills</Label>
                  <ul className="space-y-1.5 text-[15px]">
                    {SKILLS.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </div>
                <div className="space-y-8">
                  <div>
                    <Label className="mb-4">Languages</Label>
                    <p className="text-[15px]">English</p>
                  </div>
                  <div>
                    <Label className="mb-4">Based in</Label>
                    <p className="text-[15px]">Harare, Zimbabwe</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── Experience ───────── */}
      <section id="experience" className="dj-section-b">
        <div className="dj-wrap">
          <SectionHead title="Experience" n="03" />
          <Reveal>
            <Label className="mb-4">Performance</Label>
            <ExperienceTable rows={PERFORMANCE} />
          </Reveal>
          <Reveal className="mt-[var(--dj-head-gap)]">
            <Label className="mb-4">Business &amp; projects</Label>
            <ExperienceTable rows={BUSINESS} />
          </Reveal>
        </div>
      </section>

      {/* ───────── Highlights + gallery ───────── */}
      <section className="dj-section-b">
        <div className="dj-wrap">
          <SectionHead title="Highlights" n="04" />
          <div className="dj-gap grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map((h, i) => (
              <Reveal key={h.title} delay={i * 0.06} y={16}>
                <div className="border-t border-[var(--dj-ink)] pt-5">
                  <p className="dj-mono text-[11px] uppercase tracking-[0.14em] text-[var(--dj-accent)]">{h.tag}</p>
                  <h3 className="mt-3 text-[1.05rem] font-medium leading-snug tracking-[-0.01em]">{h.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[var(--dj-ink)]/70">{h.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-[var(--dj-section-y)] grid grid-cols-2 gap-[clamp(8px,1.2vw,16px)] md:grid-cols-3">
            {GALLERY.map((g, i) => (
              <Reveal key={g.src} delay={i * 0.08} y={16} className={i === 0 ? "col-span-2 md:col-span-1" : ""}>
                <div className="relative aspect-square overflow-hidden rounded-[4px] bg-[var(--dj-dark)]">
                  <Image src={g.src} alt={g.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-[1.4s] ease-out hover:scale-[1.03]" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Testimonials ───────── */}
      <section id="testimonials" className="dj-section bg-[var(--dj-dark)] text-[var(--dj-paper)]">
        <div className="dj-wrap">
          <SectionHead title="Testimonials" n="05" dark />
          <div className="dj-gap grid gap-y-12 md:grid-cols-3">
            {SEABOURN.map((q, i) => (
              <Reveal key={i} delay={i * 0.08} y={16} className="h-full">
                <figure className="flex h-full flex-col border-t border-[var(--dj-paper)]/60 pt-6">
                  <span className="dj-serif text-5xl leading-none text-[var(--dj-accent-l)]" aria-hidden>&ldquo;</span>
                  <blockquote className="dj-body mt-2 flex-1 text-[var(--dj-paper)]/85">{q}</blockquote>
                  <figcaption className="mt-8">
                    <p className="font-medium">Seabourn Cruise Line</p>
                    <p className="dj-mono mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--dj-paper)]/50">Performance appraisal</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Contact ───────── */}
      <section id="contact" className="dj-section-t">
        <div className="dj-wrap">
          <SectionHead title="Contact" n="06" />
          <Reveal>
            <p className="dj-lede mb-[var(--dj-head-gap)] text-[var(--dj-ink)]/80">For bookings, contracts and professional enquiries.</p>
          </Reveal>
          <div>
            <div className="dj-gap grid gap-y-8 md:grid-cols-3">
              {[
                { label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
                { label: "WhatsApp", value: CONTACT.whatsapp, href: CONTACT.whatsappHref },
                { label: "Phone", value: CONTACT.phone, href: CONTACT.phoneHref },
              ].map((c, i) => (
                <Reveal key={c.label} delay={i * 0.06} y={16}>
                  <a
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="group block border-t border-[var(--dj-ink)] pt-5 transition-colors hover:text-[var(--dj-accent)]"
                  >
                    <span className="dj-mono flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-[var(--dj-muted)]">
                      {c.label}
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                    <span className="mt-3 block text-[1.05rem] [overflow-wrap:anywhere]">{c.value}</span>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>

          <footer className="dj-mono mt-[var(--dj-section-y)] flex flex-col gap-2 border-t border-[var(--dj-line)] py-6 text-[11px] uppercase tracking-[0.14em] text-[var(--dj-muted)] sm:flex-row sm:justify-between">
            <span>&copy; {new Date().getFullYear()} Daniel Jenkins</span>
            <span>
              <a href={CONTACT.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--dj-ink)]">YouTube</a>
              {" / "}
              <a href="/" className="hover:text-[var(--dj-ink)]">All The Glory</a>
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
}
