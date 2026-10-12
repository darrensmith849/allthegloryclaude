import Image from "next/image";
import VideoReel, { type Reel } from "./video-reel";
import { CountUp, HeroImage, Reveal } from "./motion";
import Nav from "./nav";

// Daniel's personal resume page - a standalone share link that lives on the
// All The Glory domain. The site's nav, footer, socials and album player are
// hidden on /daniel-jenkins (see components/site/*). Fonts come from
// ./layout.tsx.
//
// Layout rule: every section sits in the same centred container and opens
// with the same header (title left, index right, hairline under), so all
// content lines up on one set of edges.

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
  { year: "2014", title: "Electric Vines Concert, Cape Town", text: "Solo supporting act alongside Jeremy Loops, Prime Circle, Matthew Mole and Goodluck." },
  { year: "2015", title: "Opened for Prime Circle", text: "Supporting act for Prime Circle in Harare." },
  { year: "Award", title: "Harare's Got Talent", text: "Third place." },
  { year: "Radio", title: "Original music on air", text: "Songs played on South African and Zimbabwean radio stations." },
];

const SKILLS = ["Recording artist", "Singer & songwriter", "Lead guitarist", "Live performer", "Creative strategist", "Diploma in Hotel Management"];

const SEABOURN = [
  "Daniel has settled in extremely well to ship life. He is very popular not only with his colleagues in the Entertainment Department but with the guests also. An excellent team member and I wish him well for the rest of his contract.",
  "Daniel has been a great asset to the team as a member of the Club trio. He is a good musician, also adds to the vocal variety of the group. He has a good attitude, is dependable and willing to help at all times.",
  "Daniel is a very good performer, singer and guitarist. He is part of the Club Trio and consistently performs his role in a very professional manner. He is very friendly with both guests and crew, a true team player.",
];

const GALLERY = [
  { src: "/media/daniel/red-door.webp", alt: "Daniel Jenkins at a red door with an acoustic guitar", pos: "object-[30%_50%]" },
  { src: "/media/daniel/stage.webp", alt: "Daniel Jenkins with his electric guitar before a show", pos: "object-[35%_40%]" },
  { src: "/media/daniel/rooftop.webp", alt: "Daniel Jenkins on a city rooftop", pos: "object-[70%_50%]" },
  { src: "/media/daniel/shadow.webp", alt: "Daniel Jenkins walking through light and shadow with his guitar", pos: "object-[50%_50%]" },
];

const WRAP = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";

function SectionHead({ title, n, dark }: { title: string; n: string; dark?: boolean }) {
  return (
    <Reveal y={16}>
      <div className={`mb-12 flex items-end justify-between border-b pb-5 md:mb-16 ${dark ? "border-[var(--dj-dline)]" : "border-[var(--dj-line)]"}`}>
        <h2 className="dj-serif text-[2.6rem] leading-none sm:text-[3.4rem]">{title}</h2>
        <span className={`dj-mono pb-1 text-[11px] uppercase tracking-[0.15em] ${dark ? "text-[var(--dj-paper)]/50" : "text-[var(--dj-muted)]"}`}>{n}</span>
      </div>
    </Reveal>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return <h3 className="dj-mono mb-4 text-[11px] uppercase tracking-[0.15em] text-[var(--dj-muted)]">{children}</h3>;
}

function ExperienceTable({ rows }: { rows: { when: string; place: string; role: string; where: string; href?: string }[] }) {
  return (
    <ol className="border-t border-[var(--dj-ink)]">
      {rows.map((r, i) => {
        const external = r.href?.startsWith("http");
        const where = r.href ? (
          <a href={r.href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="underline decoration-[var(--dj-line)] underline-offset-4 hover:text-[var(--dj-accent)] hover:decoration-current">
            {r.where}
          </a>
        ) : (
          r.where
        );
        return (
          <li key={i} className="grid gap-1 border-b border-[var(--dj-line)] py-5 md:grid-cols-[200px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-baseline md:gap-6">
            <span className="dj-mono text-[12px] text-[var(--dj-muted)]">{r.when}</span>
            <span className="text-lg font-medium tracking-[-0.01em]">{r.place}</span>
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
          --dj-bg:#ece5d9; --dj-ink:#181512; --dj-muted:#6f665c; --dj-line:rgba(24,21,18,.15);
          --dj-dark:#13110f; --dj-paper:#ece5d9; --dj-dline:rgba(236,229,217,.14);
          --dj-accent:#9a3220; --dj-accent-l:#d9774f;
          font-family: var(--dj-sans), system-ui, sans-serif;
        }
        .dj ::selection { background: var(--dj-accent); color: #fff; }
        .dj-serif { font-family: var(--dj-serif), Georgia, serif; font-weight: 400; letter-spacing: -0.01em; }
        .dj-mono { font-family: var(--dj-mono), ui-monospace, monospace; }
        .dj-eq i { display:block; width:2px; background:currentColor; animation: dj-eq .9s ease-in-out infinite; }
        .dj-eq i:nth-child(2){ animation-delay:.2s } .dj-eq i:nth-child(3){ animation-delay:.4s }
        @keyframes dj-eq { 0%,100%{height:30%} 50%{height:100%} }
        .dj-scroll { scrollbar-width: thin; scrollbar-color: rgba(236,229,217,.25) transparent; }
        .dj-scroll::-webkit-scrollbar { width:4px; } .dj-scroll::-webkit-scrollbar-thumb { background:rgba(236,229,217,.25); }
        .dj-bob { animation: dj-bob 2.2s ease-in-out infinite; }
        @keyframes dj-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
        .dj-rule { transform-origin: left; animation: dj-rule 1.4s cubic-bezier(.16,1,.3,1) both; animation-timeline: view(); animation-range: entry 0% cover 30%; }
        @keyframes dj-rule { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @media (prefers-reduced-motion: reduce) { .dj-eq i, .dj-bob, .dj-rule { animation: none; } }
      `}</style>

      <Nav />

      {/* ───────── Hero photo ───────── */}
      <section className="relative h-[86svh] min-h-[520px] overflow-hidden bg-[var(--dj-dark)]">
        <HeroImage>
          <Image
            src="/media/daniel/hero.webp"
            alt="Daniel Jenkins sitting by a red door with his guitar"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[24%_45%] md:object-[50%_45%]"
          />
        </HeroImage>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />
        <a href="#intro" className="dj-mono absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.15em] text-[var(--dj-paper)]/80 transition hover:text-white">
          <span className="dj-bob inline-block">Scroll ↓</span>
        </a>
      </section>

      {/* ───────── Introduction ───────── */}
      <section id="intro" className={`${WRAP} pb-20 pt-14 md:pb-28 md:pt-20`}>
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <h1 className="dj-serif text-[3.4rem] leading-[0.95] sm:text-[4.8rem]">Daniel Jenkins</h1>
            <p className="dj-mono mt-5 text-[11px] uppercase leading-relaxed tracking-[0.15em] text-[var(--dj-muted)]">
              {["Recording artist", "Singer-songwriter", "Lead guitarist", "Live performer"].map((r, i) => (
                <span key={r}>{i > 0 && " · "}<span className="whitespace-nowrap">{r}</span></span>
              ))}
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-[1.15rem] leading-[1.7] text-[var(--dj-ink)]/85 md:pt-3">
              Singer-songwriter and lead guitarist based in Harare, Zimbabwe. Over 500 performances at sea with Seabourn Cruise
              Line, contracts in Greece and the UAE, and supporting slots for some of South Africa&apos;s biggest artists. Currently
              Executive Manager at 2KO.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#showreels" className="dj-mono rounded-[3px] bg-[var(--dj-ink)] px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-[var(--dj-paper)] transition hover:bg-[var(--dj-accent)]">
                Watch showreels
              </a>
              <a href="#contact" className="dj-mono rounded-[3px] border border-[var(--dj-ink)]/30 px-4 py-3 text-[11px] uppercase tracking-[0.12em] transition hover:border-[var(--dj-ink)]">
                Contact details
              </a>
            </div>
          </Reveal>
        </div>

        <div className="mt-16 md:mt-20">
          <Reveal y={0} className="origin-left">
            <div className="dj-rule h-px bg-[var(--dj-ink)]" />
          </Reveal>
          <dl className="grid grid-cols-2 md:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={0.15 + i * 0.12} y={24}>
                <div className={`h-full border-b border-[var(--dj-line)] py-6 md:border-b-0 ${i % 2 ? "pl-5" : ""} ${i > 0 ? "md:border-l md:pl-6" : ""} ${i === 1 || i === 3 ? "border-l" : ""}`}>
                  <dd className="text-[2.6rem] font-light leading-none tracking-[-0.04em] sm:text-[3.2rem]">
                    <CountUp to={s.to} from={s.from} suffix={s.suffix} />
                  </dd>
                  <dt className="dj-mono mt-3 text-[11px] uppercase tracking-[0.12em] text-[var(--dj-muted)]">{s.label}</dt>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* ───────── Showreels ───────── */}
      <section id="showreels" className="bg-[var(--dj-dark)] py-20 text-[var(--dj-paper)] md:py-28">
        <div className={WRAP}>
          <SectionHead title="Showreels" n="01" dark />
          <Reveal delay={0.05}>
            <VideoReel reels={REELS} />
          </Reveal>
          <p className="dj-mono mt-6 text-[11px] uppercase tracking-[0.12em] text-[var(--dj-paper)]/50">
            More on{" "}
            <a href={CONTACT.youtube} target="_blank" rel="noopener noreferrer" className="text-[var(--dj-paper)] underline underline-offset-4 hover:text-[var(--dj-accent-l)]">
              YouTube
            </a>
          </p>
        </div>
      </section>

      {/* ───────── About ───────── */}
      <section id="about" className={`${WRAP} py-20 md:py-28`}>
        <SectionHead title="About" n="02" />
        <div className="grid items-start gap-10 md:grid-cols-2 md:gap-16">
          <Reveal className="md:sticky md:top-8">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[4px]">
              <Image src="/media/daniel/portrait.webp" alt="Daniel Jenkins" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="space-y-5 text-[1.05rem] leading-[1.75] text-[var(--dj-ink)]/85">
              <p>
                Daniel obtained a diploma in Hotel Management in Cape Town at the end of 2013 and has since pursued his dream of
                becoming a singer-songwriter. He continues to write and release songs, some of which have been played on South
                African and Zimbabwean radio.
              </p>
              <p>
                He established himself quickly as a performer, playing hundreds of gigs in his first year across Cape Town,
                Durban, Victoria Falls and Harare. In 2015 he spent a summer performing in Greece, followed by two years in the UAE
                with a four-piece band at Danat Al Ain Resort and a duo at the Kempinski Hotel, Ajman.
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
            <div className="mt-10 grid grid-cols-1 gap-8 border-t border-[var(--dj-line)] pt-6 sm:grid-cols-2">
              <div>
                <SubHead>Skills</SubHead>
                <ul className="space-y-1.5 text-[15px]">
                  {SKILLS.map((s) => <li key={s}>{s}</li>)}
                </ul>
              </div>
              <div>
                <SubHead>Languages</SubHead>
                <p className="text-[15px]">English</p>
                <div className="mt-8">
                  <SubHead>Based in</SubHead>
                  <p className="text-[15px]">Harare, Zimbabwe</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── Experience ───────── */}
      <section id="experience" className={`${WRAP} py-20 md:py-28`}>
        <SectionHead title="Experience" n="03" />
        <Reveal>
          <SubHead>Performance</SubHead>
          <ExperienceTable rows={PERFORMANCE} />
        </Reveal>
        <Reveal className="mt-14">
          <SubHead>Business &amp; projects</SubHead>
          <ExperienceTable rows={BUSINESS} />
        </Reveal>
      </section>

      {/* ───────── Highlights ───────── */}
      <section className={`${WRAP} py-20 md:py-28`}>
        <SectionHead title="Highlights" n="04" />
        <div className="grid border-t border-[var(--dj-ink)] sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h, i) => (
            <Reveal key={h.title} delay={i * 0.06} y={16} className="h-full">
              <div className={`h-full border-b border-[var(--dj-line)] py-6 sm:px-6 ${i % 2 === 0 ? "sm:pl-0" : "sm:border-l"} lg:border-b-0 ${i > 0 ? "lg:border-l lg:pl-6" : "lg:pl-0"}`}>
                <p className="dj-mono text-[11px] uppercase tracking-[0.12em] text-[var(--dj-accent)]">{h.year}</p>
                <h3 className="mt-4 text-lg font-medium leading-snug tracking-[-0.01em]">{h.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--dj-ink)]/70">{h.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Gallery ───────── */}
      <section className={`${WRAP} pb-20 md:pb-28`}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {GALLERY.map((g, i) => (
            <Reveal key={g.src} delay={i * 0.06} y={16}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[4px] bg-[var(--dj-dark)]">
                <Image src={g.src} alt={g.alt} fill sizes="(max-width: 768px) 50vw, 25vw" className={`object-cover ${g.pos}`} />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Testimonials ───────── */}
      <section id="testimonials" className="bg-[var(--dj-dark)] py-20 text-[var(--dj-paper)] md:py-28">
        <div className={WRAP}>
          <SectionHead title="Testimonials" n="05" dark />
          <Reveal>
            <figure className="border border-[var(--dj-dline)] p-6 sm:p-10">
              <blockquote className="space-y-4 text-[1.1rem] leading-[1.7] text-[var(--dj-paper)]/85 sm:text-[1.2rem]">
                <p>
                  &ldquo;Daniel Jenkins worked with me personally at Impart Global, a company which specializes in frontiering app
                  technology in the web3 space, as well as mending the broken creative industries through technology and support
                  programs.
                </p>
                <p>
                  Daniel&apos;s keen understanding of relationships and human psychology, as well as his love of and skill in music,
                  paired beautifully with his relentless ability to work at tasks until they are complete.
                </p>
                <p>
                  I&apos;ve seldom met someone who is able to adapt and learn at such a rapid pace wherever required, and maintain a
                  standard of excellence in his work. I highly recommend him for any jobs to do with relationships, creative
                  marketing and music.&rdquo;
                </p>
              </blockquote>
              <figcaption className="mt-8 border-t border-[var(--dj-dline)] pt-5">
                <p className="font-medium">Liam Pitcher</p>
                <p className="dj-mono mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--dj-paper)]/50">Founder &amp; CEO, Impart Global</p>
              </figcaption>
            </figure>
          </Reveal>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {SEABOURN.map((q, i) => (
              <Reveal key={i} delay={i * 0.06} y={16} className="h-full">
                <figure className="flex h-full flex-col border border-[var(--dj-dline)] p-6">
                  <blockquote className="flex-1 text-[15px] leading-[1.7] text-[var(--dj-paper)]/80">&ldquo;{q}&rdquo;</blockquote>
                  <figcaption className="mt-6 border-t border-[var(--dj-dline)] pt-4">
                    <p className="font-medium">Seabourn Cruise Line</p>
                    <p className="dj-mono mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--dj-paper)]/50">Performance appraisal</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Contact ───────── */}
      <section id="contact" className={`${WRAP} pb-10 pt-20 md:pt-28`}>
        <SectionHead title="Contact" n="06" />
        <Reveal>
          <p className="mb-10 max-w-xl text-[1.1rem] leading-relaxed text-[var(--dj-ink)]/80">
            For bookings, contracts and professional enquiries, please get in touch by email, WhatsApp or phone.
          </p>
        </Reveal>
        <div className="grid border-t border-[var(--dj-ink)] md:grid-cols-3">
          {[
            { label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
            { label: "WhatsApp", value: CONTACT.whatsapp, href: CONTACT.whatsappHref },
            { label: "Phone", value: CONTACT.phone, href: CONTACT.phoneHref },
          ].map((c, i) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`group flex items-end justify-between gap-4 border-b border-[var(--dj-line)] py-6 transition-colors hover:text-[var(--dj-accent)] md:pr-6 ${i > 0 ? "md:border-l md:pl-6" : ""}`}
            >
              <span className="min-w-0">
                <span className="dj-mono block text-[11px] uppercase tracking-[0.12em] text-[var(--dj-muted)]">{c.label}</span>
                <span className="mt-2 block break-all text-lg">{c.value}</span>
              </span>
              <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
            </a>
          ))}
        </div>
        <div className="dj-mono mt-24 flex flex-col gap-2 border-t border-[var(--dj-line)] pt-5 text-[11px] uppercase tracking-[0.12em] text-[var(--dj-muted)] sm:flex-row sm:justify-between">
          <span>&copy; {new Date().getFullYear()} Daniel Jenkins</span>
          <span>
            <a href={CONTACT.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--dj-ink)]">YouTube</a>
            {" / "}
            <a href="/" className="hover:text-[var(--dj-ink)]">All The Glory</a>
          </span>
        </div>
      </section>
    </main>
  );
}
