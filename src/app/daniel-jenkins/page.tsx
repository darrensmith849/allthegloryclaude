import Image from "next/image";
import VideoReel, { type Reel } from "./video-reel";
import { CountUp, HeroImage, Reveal, RiseWords } from "./motion";

// Daniel's personal resume page - a standalone share link that lives on the
// All The Glory domain. The site's nav, footer, socials and album player are
// hidden on /daniel-jenkins (see components/site/*). Fonts come from
// ./layout.tsx. Editorial look: warm paper, hairline rules, serif display,
// mono labels, one dark "screening room" for the showreels.

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
  { to: 500, suffix: "+", label: "Performances at sea" },
  { to: 30, suffix: "+", label: "Countries played" },
  { to: 5, suffix: "", label: "Continents" },
  { to: 2013, from: 1990, suffix: "", label: "On stage since" },
];

const EXPERIENCE = [
  { years: "2024", place: "Seabourn Odyssey", role: "Lead guitar & vocals, trio", where: "Alaska · Japan" },
  { years: "2023–24", place: "Seabourn Odyssey", role: "Lead guitar & vocals, trio", where: "Alaska · Australia · New Zealand" },
  { years: "2022–23", place: "Seabourn Odyssey", role: "Lead guitar & vocals, trio", where: "Australia · French Polynesia · NZ" },
  { years: "2019–20", place: "Seabourn Quest", role: "Lead guitar & vocals, trio", where: "Antarctica · Canada · The Americas" },
  { years: "2017–18", place: "Kempinski Hotel", role: "Lead guitar & vocals, duo", where: "Ajman · UAE" },
  { years: "2016–17", place: "Danat Al Ain Resort", role: "Lead guitar & vocals, four-piece", where: "Al Ain · UAE" },
  { years: "2015", place: "Circus Taverna", role: "Summer residency", where: "Greece" },
];

const HIGHLIGHTS = [
  { title: "Electric Vines, Cape Town", text: "Solo support on a bill with Jeremy Loops, Prime Circle, Matthew Mole and Goodluck.", year: "2014" },
  { title: "Opening for Prime Circle", text: "Opened for one of South Africa's biggest rock bands in Harare.", year: "2015" },
  { title: "Harare's Got Talent", text: "Third place.", year: "" },
  { title: "On the radio", text: "Original songs played on South African and Zimbabwean stations.", year: "" },
];

const NOW = [
  { tag: "Currently", title: "Executive Manager", org: "2KO", href: "https://2ko.co.za", text: "Operational improvement, training and automation for businesses across Africa." },
  { tag: "As an artist", title: "All The Glory", org: "From Darkness To Light", href: "/", text: "His debut worship album and a daily chronological Bible study." },
  { tag: "Previously", title: "Co-Founder", org: "Impart Global", href: "https://www.impart.global", text: "A creative tech company built to change the way fans and artists connect." },
];

const SEABOURN = [
  "Very popular not only with his colleagues in the Entertainment Department but with the guests also. An excellent team member.",
  "A great asset to the team. A good musician who adds to the vocal variety of the group; dependable and willing to help at all times.",
  "A very good performer, singer and guitarist. A true team player who practices constantly, always working to improve his performance.",
];

const SKILLS = ["Recording artist", "Singer & songwriter", "Lead guitar", "Live performance", "Creative strategy", "Hotel management dip."];

function Label({ n, children, dark }: { n: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`dj-mono flex items-center gap-3 text-[11px] uppercase tracking-[0.15em] ${dark ? "text-[var(--dj-paper)]/55" : "text-[var(--dj-muted)]"}`}>
      <span>({n})</span>
      <span>{children}</span>
    </p>
  );
}

// A small rounded photo set into a line of text.
function Pill({ src }: { src: string }) {
  return (
    <span className="relative mx-[0.12em] inline-block h-[0.78em] w-[1.6em] translate-y-[0.06em] overflow-hidden rounded-full align-baseline" aria-hidden>
      <Image src={src} alt="" fill sizes="120px" className="object-cover" />
    </span>
  );
}

function Fig({ src, alt, cap, aspect }: { src: string; alt: string; cap: string; aspect: string }) {
  return (
    <figure>
      <div className={`relative overflow-hidden rounded-[4px] ${aspect}`}>
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 50vw, 40vw" className="object-cover transition duration-[1.6s] ease-out hover:scale-[1.04]" />
      </div>
      <figcaption className="dj-mono mt-2 text-[11px] uppercase tracking-[0.12em] text-[var(--dj-muted)]">{cap}</figcaption>
    </figure>
  );
}

export default function DanielJenkinsPage() {
  return (
    <main className="dj relative min-h-screen overflow-x-clip bg-[var(--dj-bg)] text-[var(--dj-ink)]">
      <style>{`
        .dj {
          --dj-bg:#ece5d9; --dj-ink:#181512; --dj-muted:#7a7066; --dj-line:rgba(24,21,18,.16);
          --dj-dark:#13110f; --dj-paper:#ece5d9; --dj-dline:rgba(236,229,217,.14);
          --dj-accent:#9a3220; --dj-accent-l:#d9774f;
          font-family: var(--dj-sans), system-ui, sans-serif;
        }
        .dj ::selection { background: var(--dj-accent); color: #fff; }
        .dj-serif { font-family: var(--dj-serif), Georgia, serif; font-weight: 400; letter-spacing: -0.01em; }
        .dj-mono { font-family: var(--dj-mono), ui-monospace, monospace; }
        .dj-ul { background: linear-gradient(currentColor, currentColor) 0 100% / 100% 1px no-repeat; transition: background-size .5s cubic-bezier(.16,1,.3,1); }
        .dj-ul:hover { background-size: 0 1px; background-position: 100% 100%; }
        .dj-eq i { display:block; width:2px; background:currentColor; animation: dj-eq .9s ease-in-out infinite; }
        .dj-eq i:nth-child(2){ animation-delay:.2s } .dj-eq i:nth-child(3){ animation-delay:.4s }
        @keyframes dj-eq { 0%,100%{height:30%} 50%{height:100%} }
        .dj-scroll { scrollbar-width: thin; scrollbar-color: rgba(236,229,217,.25) transparent; }
        .dj-scroll::-webkit-scrollbar { width:4px; } .dj-scroll::-webkit-scrollbar-thumb { background:rgba(236,229,217,.25); }
        .dj-row .dj-row-place { transition: transform .6s cubic-bezier(.16,1,.3,1), color .4s; }
        .dj-row:hover .dj-row-place { transform: translateX(14px); color: var(--dj-accent); }
        @media (prefers-reduced-motion: reduce) { .dj-eq i { animation: none; } }
      `}</style>

      {/* ───────── Hero: inset photo frame ───────── */}
      <section className="p-2 sm:p-3">
        <div className="relative flex h-[calc(100svh-1rem)] min-h-[560px] flex-col overflow-hidden rounded-[6px] bg-[var(--dj-dark)] sm:h-[calc(100svh-1.5rem)]">
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
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/70" />

          {/* Floating bar */}
          <header className="relative z-10 m-3 flex items-center justify-between rounded-[4px] bg-black/25 px-4 py-3 text-[var(--dj-paper)] backdrop-blur-md sm:m-4 sm:px-5">
            <a href="/daniel-jenkins" className="dj-serif text-xl leading-none">Daniel Jenkins</a>
            <nav className="dj-mono hidden items-center gap-7 text-[11px] uppercase tracking-[0.12em] md:flex">
              <a href="#showreels" className="opacity-80 hover:opacity-100">Showreels</a>
              <a href="#about" className="opacity-80 hover:opacity-100">About</a>
              <a href="#experience" className="opacity-80 hover:opacity-100">Experience</a>
              <a href="#contact" className="opacity-80 hover:opacity-100">Contact</a>
            </nav>
            <a href="#contact" className="dj-mono rounded-[3px] bg-[var(--dj-paper)] px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-[var(--dj-ink)] transition hover:bg-white">
              Book
            </a>
          </header>

          <div className="relative z-10 mt-auto px-5 pb-6 text-[var(--dj-paper)] sm:px-8 sm:pb-8">
            <h1 className="dj-serif text-[clamp(3.6rem,11vw,12rem)] leading-[0.86] md:text-right">
              <RiseWords words={["Singer,", "songwriter,"]} delay={0.2} />
              <span className="italic">
                <RiseWords words={["guitarist."]} delay={0.44} />
              </span>
            </h1>
            <Reveal delay={0.9} y={16}>
              <div className="dj-mono mt-8 grid grid-cols-2 gap-4 border-t border-white/25 pt-4 text-[11px] uppercase tracking-[0.12em] text-[var(--dj-paper)]/75 md:grid-cols-4">
                <span>Daniel Jenkins</span>
                <span className="text-right md:text-left">Harare, Zimbabwe</span>
                <span className="hidden md:block">Live since 2013</span>
                <a href="#showreels" className="hidden text-right hover:text-white md:block">Scroll ↓</a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── Statement ───────── */}
      <section className="px-5 pb-24 pt-24 sm:px-8 md:pb-36 md:pt-36">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-3">
            <Reveal><Label n="01">Introduction</Label></Reveal>
          </div>
          <Reveal className="md:col-span-9" delay={0.05}>
            <p className="dj-serif text-[clamp(2.1rem,4.6vw,4.6rem)] leading-[1.06]">
              A singer-songwriter and lead guitarist from Harare <Pill src="/media/daniel/red-door.webp" /> who has played more
              than <em>five hundred</em> shows at sea, across thirty countries and five continents <Pill src="/media/daniel/stage.webp" /> and
              still believes the best part of any night is <em>the room singing back.</em>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───────── Showreels: screening room ───────── */}
      <section id="showreels" className="bg-[var(--dj-dark)] px-3 py-20 text-[var(--dj-paper)] sm:px-8 md:py-28">
        <div className="mb-12 grid gap-8 px-2 sm:px-0 md:mb-16 md:grid-cols-12 md:items-end">
          <div className="md:col-span-3">
            <Reveal><Label n="02" dark>Showreels</Label></Reveal>
          </div>
          <Reveal className="md:col-span-6" delay={0.05}>
            <h2 className="dj-serif text-[clamp(3.2rem,8vw,8rem)] leading-[0.9]">
              Watch him <em>live</em>
            </h2>
          </Reveal>
          <Reveal className="md:col-span-3 md:text-right" delay={0.1}>
            <a href={CONTACT.youtube} target="_blank" rel="noopener noreferrer" className="dj-mono dj-ul pb-0.5 text-[11px] uppercase tracking-[0.12em]">
              YouTube channel ↗
            </a>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <VideoReel reels={REELS} />
        </Reveal>
      </section>

      {/* ───────── Numbers ───────── */}
      <section className="px-5 py-24 sm:px-8 md:py-32">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-3">
            <Reveal><Label n="03">In numbers</Label></Reveal>
          </div>
          <dl className="md:col-span-9">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.06} y={20}>
                <div className={`grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-baseline border-t border-[var(--dj-line)] py-5 md:py-6 ${i === STATS.length - 1 ? "border-b" : ""}`}>
                  <dd className="text-[clamp(2.6rem,6vw,5.5rem)] font-light leading-none tracking-[-0.04em]">
                    <CountUp to={s.to} from={"from" in s ? s.from : 0} suffix={s.suffix} />
                  </dd>
                  <dt className="text-[clamp(1.1rem,2.4vw,2.2rem)] font-light tracking-[-0.02em] text-[var(--dj-muted)]">{s.label}</dt>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* ───────── About ───────── */}
      <section id="about" className="border-t border-[var(--dj-line)] px-5 py-24 sm:px-8 md:py-32">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <Reveal><Label n="04">About</Label></Reveal>
          </div>
          <Reveal className="md:col-span-4">
            <Fig src="/media/daniel/portrait.webp" alt="Daniel Jenkins smiling at a cafe table" cap="Fig. 01 — Daniel Jenkins" aspect="aspect-[4/5]" />
          </Reveal>
          <div className="md:col-span-5">
            <Reveal delay={0.08}>
              <h2 className="dj-serif text-[clamp(2.4rem,4vw,3.8rem)] leading-[1]">
                From Cape Town stages to the <em>ends of the earth.</em>
              </h2>
              <div className="mt-8 space-y-5 text-[1.02rem] leading-[1.75] text-[var(--dj-ink)]/80">
                <p>
                  Daniel finished a diploma in Hotel Management in Cape Town at the end of 2013, then followed his dream of being a
                  singer-songwriter. In his first year he played hundreds of gigs across Cape Town, Durban, Victoria Falls and
                  Harare, and his own songs have since been played on South African and Zimbabwean radio.
                </p>
                <p>
                  A summer residency in Greece led to two years in the UAE with a four-piece band and a duo, then to Seabourn Cruise
                  Line, where he has led trios on guitar and vocals for more than 500 shows, from Antarctica to Alaska.
                </p>
                <p>
                  Off the ships he plays solo in venues of every kind, with a repertoire that reads any room. He builds real, lasting
                  relationships, he&apos;s organised and reliable, and he brings ideas that open new doors for a business.
                </p>
              </div>
              <ul className="dj-mono mt-10 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.1em]">
                {SKILLS.map((s) => (
                  <li key={s} className="rounded-[3px] border border-[var(--dj-line)] px-2.5 py-1.5 text-[var(--dj-ink)]/75">{s}</li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── Now ───────── */}
      <section className="border-t border-[var(--dj-line)] px-5 py-24 sm:px-8 md:py-32">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <Reveal><Label n="05">Right now</Label></Reveal>
          </div>
          <div className="grid border-t border-[var(--dj-line)] md:col-span-9 md:grid-cols-3 md:border-l md:border-t-0">
            {NOW.map((c, i) => (
              <Reveal key={c.org} delay={i * 0.08} y={20}>
                <a
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group flex h-full flex-col border-b border-[var(--dj-line)] px-1 py-8 transition-colors duration-500 hover:bg-[var(--dj-ink)] hover:text-[var(--dj-paper)] md:min-h-[340px] md:border-b-0 md:border-r md:px-7"
                >
                  <span className="dj-mono flex items-center justify-between text-[11px] uppercase tracking-[0.12em] opacity-60">
                    {c.tag}
                    <span className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
                  </span>
                  <span className="dj-serif mt-10 text-[2.6rem] leading-[0.95] md:mt-auto">{c.title}</span>
                  <span className="dj-serif text-[2.6rem] italic leading-[1.05] text-[var(--dj-accent)] group-hover:text-[var(--dj-accent-l)]">{c.org}</span>
                  <span className="mt-5 max-w-[30ch] text-sm leading-relaxed opacity-70">{c.text}</span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Experience ───────── */}
      <section id="experience" className="border-t border-[var(--dj-line)] px-5 py-24 sm:px-8 md:py-32">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <Reveal><Label n="06">Experience</Label></Reveal>
          </div>
          <div className="md:col-span-9">
            <Reveal>
              <h2 className="dj-serif mb-14 text-[clamp(3rem,7vw,7rem)] leading-[0.9]">
                The road <em>so far</em>
              </h2>
            </Reveal>
            <ol>
              {EXPERIENCE.map((t, i) => (
                <Reveal key={i} y={14} delay={i * 0.03}>
                  <li className={`dj-row grid grid-cols-[64px_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 border-t border-[var(--dj-line)] py-5 md:grid-cols-[100px_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] md:py-7 ${i === EXPERIENCE.length - 1 ? "border-b" : ""}`}>
                    <span className="dj-mono text-[11px] text-[var(--dj-muted)]">{t.years}</span>
                    <span className="dj-row-place dj-serif text-[1.9rem] leading-none md:text-[2.4rem]">{t.place}</span>
                    <span className="col-start-2 text-sm text-[var(--dj-ink)]/70 md:col-start-auto">{t.role}</span>
                    <span className="dj-mono col-start-2 text-[11px] uppercase tracking-[0.08em] text-[var(--dj-muted)] md:col-start-auto md:text-right">{t.where}</span>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ───────── Highlights ───────── */}
      <section className="px-2 pb-2 sm:px-3 sm:pb-3">
        <div className="grid overflow-hidden rounded-[6px] bg-[var(--dj-dark)] text-[var(--dj-paper)] lg:grid-cols-2">
          <div className="relative min-h-[70svh] lg:min-h-[88svh]">
            <Image src="/media/daniel/stage.webp" alt="Daniel Jenkins with his electric guitar before a show" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover object-[30%_30%]" />
          </div>
          <div className="flex flex-col justify-between gap-12 p-6 sm:p-10 lg:p-14">
            <Reveal><Label n="07" dark>Highlights</Label></Reveal>
            <div>
              <Reveal>
                <h2 className="dj-serif text-[clamp(2.6rem,5vw,4.8rem)] leading-[0.95]">
                  Shared stages with <em>the best.</em>
                </h2>
              </Reveal>
              <ul className="mt-12">
                {HIGHLIGHTS.map((h, i) => (
                  <Reveal key={h.title} delay={i * 0.06} y={14}>
                    <li className="grid grid-cols-[40px_minmax(0,1fr)_auto] gap-4 border-t border-[var(--dj-dline)] py-5">
                      <span className="dj-mono pt-1 text-[11px] text-[var(--dj-paper)]/45">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <h3 className="dj-serif text-2xl leading-tight">{h.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--dj-paper)]/60">{h.text}</p>
                      </div>
                      <span className="dj-mono pt-1 text-[11px] text-[var(--dj-paper)]/45">{h.year}</span>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Kind words ───────── */}
      <section className="px-5 py-24 sm:px-8 md:py-36">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <Reveal><Label n="08">Kind words</Label></Reveal>
          </div>
          <div className="md:col-span-9">
            <Reveal>
              <figure>
                <blockquote className="dj-serif text-[clamp(2rem,4.4vw,4.4rem)] leading-[1.06]">
                  &ldquo;I&apos;ve seldom met someone who is able to adapt and learn at such a rapid pace, and <em>maintain a standard of
                  excellence in his work.</em>&rdquo;
                </blockquote>
                <figcaption className="dj-mono mt-8 text-[11px] uppercase tracking-[0.12em] text-[var(--dj-muted)]">
                  Liam Pitcher &mdash; Founder &amp; CEO, Impart Global
                </figcaption>
              </figure>
            </Reveal>
            <div className="mt-20 grid gap-10 md:grid-cols-3 md:gap-8">
              {SEABOURN.map((q, i) => (
                <Reveal key={i} delay={i * 0.08} y={16}>
                  <figure className="border-t border-[var(--dj-ink)] pt-5">
                    <blockquote className="text-[0.98rem] leading-[1.65] text-[var(--dj-ink)]/80">&ldquo;{q}&rdquo;</blockquote>
                    <figcaption className="dj-mono mt-5 text-[11px] uppercase tracking-[0.12em] text-[var(--dj-muted)]">Seabourn appraisal</figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Gallery ───────── */}
      <section className="grid grid-cols-2 gap-2 px-2 sm:gap-3 sm:px-3 md:grid-cols-12">
        <Reveal className="md:col-span-4">
          <Fig src="/media/daniel/red-door.webp" alt="Daniel Jenkins at a red door with an acoustic guitar" cap="Fig. 02" aspect="aspect-square" />
        </Reveal>
        <Reveal className="md:col-span-3 md:mt-28" delay={0.08}>
          <Fig src="/media/daniel/rooftop.webp" alt="Daniel Jenkins on a city rooftop" cap="Fig. 03" aspect="aspect-square" />
        </Reveal>
        <Reveal className="col-span-2 md:col-span-5" delay={0.16}>
          <Fig src="/media/daniel/shadow.webp" alt="Daniel Jenkins walking through light and shadow with his guitar" cap="Fig. 04" aspect="aspect-[16/10]" />
        </Reveal>
      </section>

      {/* ───────── Contact ───────── */}
      <section id="contact" className="px-5 pb-8 pt-28 sm:px-8 md:pt-40">
        <Reveal><Label n="09">Bookings &amp; contracts</Label></Reveal>
        <Reveal delay={0.05}>
          <h2 className="dj-serif mt-8 text-[clamp(4.5rem,16vw,16rem)] leading-[0.85]">
            Let&apos;s <em>talk.</em>
          </h2>
        </Reveal>
        <div className="mt-16 grid border-t border-[var(--dj-ink)] md:grid-cols-3">
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
              className={`group flex items-end justify-between gap-4 border-b border-[var(--dj-line)] py-7 transition-colors duration-500 hover:text-[var(--dj-accent)] md:border-b-0 md:pr-7 ${i > 0 ? "md:border-l md:pl-7" : ""}`}
            >
              <span className="min-w-0">
                <span className="dj-mono block text-[11px] uppercase tracking-[0.12em] text-[var(--dj-muted)]">{c.label}</span>
                <span className="mt-2 block break-all text-lg tracking-[-0.01em] sm:text-xl">{c.value}</span>
              </span>
              <span className="text-xl transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1">↗</span>
            </a>
          ))}
        </div>
        <div className="dj-mono mt-24 flex flex-col gap-2 border-t border-[var(--dj-line)] pt-5 text-[11px] uppercase tracking-[0.12em] text-[var(--dj-muted)] sm:flex-row sm:justify-between">
          <span>&copy; {new Date().getFullYear()} Daniel Jenkins</span>
          <span>Harare, Zimbabwe</span>
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
