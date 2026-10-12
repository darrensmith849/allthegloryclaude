import Image from "next/image";
import VideoReel, { type Reel } from "./video-reel";
import { CountUp, HeroImage, Reveal, RiseWords } from "./motion";

// Daniel's personal resume page - a standalone share link that lives on the
// All The Glory domain. The site's nav, footer, socials and album player are
// hidden on /daniel-jenkins (see components/site/*). Fonts come from
// ./layout.tsx.

const CONTACT = {
  email: "danieljenkinsofficial@gmail.com",
  phone: "+263 78 829 1503",
  phoneHref: "tel:+263788291503",
  whatsapp: "+27 84 665 1423",
  whatsappHref: "https://wa.me/27846651423",
  youtube: "https://www.youtube.com/danieljenkins92",
};

// Baby Come Back leads; the rest follow in the playlist.
const REELS: Reel[] = [
  { id: "HG1sJOBo2ko", year: "2025", title: "Baby Come Back", note: "Player cover, recorded live" },
  { id: "do9D6ra6QT8", year: "2025", title: "Solo Live Showreel", note: "Solo set with lead guitar" },
  { id: "-LCMQwrVxMU", year: "2023", title: "Solo Promo", note: "Filmed at sea with Seabourn" },
  { id: "EdMA62ZW_E8", year: "2017", title: "Duo Performance", note: "Live in Dubai" },
  { id: "MPYOLi9gkoA", year: "2017", title: "Live Festival", note: "On stage in London" },
];

const STATS = [
  { to: 500, suffix: "+", label: "shows at sea" },
  { to: 30, suffix: "+", label: "countries" },
  { to: 5, suffix: "", label: "continents" },
  { to: 12, suffix: "", label: "years on stage" },
];

const TOUR = [
  { years: "2024", place: "Seabourn Odyssey", role: "Lead guitar & vocals · trio", where: "Alaska, Japan" },
  { years: "2023-24", place: "Seabourn Odyssey", role: "Lead guitar & vocals · trio", where: "Alaska, Australia, New Zealand" },
  { years: "2022-23", place: "Seabourn Odyssey", role: "Lead guitar & vocals · trio", where: "Australia, French Polynesia, New Zealand" },
  { years: "2019-20", place: "Seabourn Quest", role: "Lead guitar & vocals · trio", where: "Antarctica, Canada, the Americas" },
  { years: "2017-18", place: "Kempinski Hotel", role: "Lead guitar & vocals · duo", where: "Ajman, UAE" },
  { years: "2016-17", place: "Danat Al Ain Resort", role: "Lead guitar & vocals · four-piece band", where: "Al Ain, UAE" },
  { years: "2015", place: "Circus Taverna", role: "Summer residency", where: "Greece" },
];

const BIG_NIGHTS = [
  { title: "Electric Vines, Cape Town", text: "Solo support on a bill with Jeremy Loops, Prime Circle, Matthew Mole and Goodluck (2014)." },
  { title: "Opening for Prime Circle", text: "Warming up the room for one of South Africa's biggest rock bands in Harare (2015)." },
  { title: "Harare's Got Talent", text: "Took third place." },
  { title: "On the radio", text: "Original songs played on South African and Zimbabwean stations." },
];

const MARQUEE = ["Singer-Songwriter", "Lead Guitarist", "Live Performer", "Recording Artist", "500+ Shows at Sea", "Harare to the World"];

const SEABOURN = [
  "Very popular not only with his colleagues in the Entertainment Department but with the guests also. An excellent team member.",
  "A great asset to the team. A good musician who adds to the vocal variety of the group, with a good attitude, dependable and willing to help at all times.",
  "A very good performer, singer and guitarist. A true team player who practices constantly, always working to improve his performance.",
];

function Kicker({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="mb-6 flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.4em] text-[var(--dj-amber)]">
      <span className="dj-serif text-base normal-case tracking-normal text-[var(--dj-cream)]/40">{n}</span>
      <span className="h-px w-10 bg-[var(--dj-amber)]/50" />
      {children}
    </p>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" className="h-[0.5em] w-[0.5em] shrink-0 text-[var(--dj-amber)]" fill="currentColor" aria-hidden>
      <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
    </svg>
  );
}

export default function DanielJenkinsPage() {
  return (
    <main className="dj relative min-h-screen overflow-x-clip bg-[var(--dj-bg)] text-[var(--dj-cream)]">
      <style>{`
        .dj {
          --dj-bg:#0b0908; --dj-cream:#f3ebe0; --dj-rust:#c8452c; --dj-amber:#e3a55f; --dj-line:rgba(243,235,224,.12);
          font-family: var(--dj-body), system-ui, sans-serif;
        }
        .dj-poster { font-family: var(--dj-poster), Impact, sans-serif; text-transform: uppercase; letter-spacing: .005em; }
        .dj-serif { font-family: var(--dj-serif), Georgia, serif; }
        .dj-outline { color: transparent; -webkit-text-stroke: 1.5px var(--dj-cream); }
        .dj-link { background: linear-gradient(var(--dj-rust), var(--dj-rust)) 0 100% / 100% 2px no-repeat; transition: background-size .35s, color .35s; color: var(--dj-cream); }
        .dj-link:hover { background-size: 100% 100%; }
        .dj-btn { display:inline-flex; align-items:center; gap:.6rem; border-radius:999px; padding:1rem 1.6rem; font-weight:700; font-size:.82rem; letter-spacing:.18em; text-transform:uppercase; transition:transform .25s, background .25s, color .25s; }
        .dj-btn:hover { transform: translateY(-2px); }
        .dj-marquee { display:flex; width:max-content; animation: dj-marquee 38s linear infinite; }
        @keyframes dj-marquee { to { transform: translateX(-50%); } }
        .dj-spin { animation: dj-spin 18s linear infinite; }
        @keyframes dj-spin { to { transform: rotate(360deg); } }
        .dj-pulse { box-shadow: 0 0 0 0 rgba(200,69,44,.6); animation: dj-pulse 2.4s infinite; }
        @keyframes dj-pulse { 70% { box-shadow: 0 0 0 26px rgba(200,69,44,0); } 100% { box-shadow: 0 0 0 0 rgba(200,69,44,0); } }
        .dj-eq i { display:block; width:2px; background:#fff; animation: dj-eq .9s ease-in-out infinite; }
        .dj-eq i:nth-child(2){ animation-delay:.2s } .dj-eq i:nth-child(3){ animation-delay:.4s }
        @keyframes dj-eq { 0%,100%{height:30%} 50%{height:100%} }
        .dj-scroll { scrollbar-width: thin; scrollbar-color: rgba(243,235,224,.25) transparent; }
        .dj-scroll::-webkit-scrollbar { width:6px; height:6px; } .dj-scroll::-webkit-scrollbar-thumb { background:rgba(243,235,224,.25); border-radius:9px; }
        .dj-row { transition: background .4s, padding .4s; }
        .dj-row:hover { background: linear-gradient(90deg, rgba(200,69,44,.18), transparent 80%); }
        .dj-row:hover .dj-row-place { color: var(--dj-amber); }
        .dj-glow { background: radial-gradient(60% 50% at 50% 0%, rgba(200,69,44,.18), transparent 70%); }
        @media (prefers-reduced-motion: reduce) { .dj-marquee, .dj-spin, .dj-pulse, .dj-eq i { animation: none; } }
      `}</style>

      {/* ───────── Hero ───────── */}
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
        <HeroImage>
          <Image
            src="/media/daniel/hero.webp"
            alt="Daniel Jenkins sitting by a red door with his guitar"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[24%_40%] md:object-[20%_40%]"
          />
        </HeroImage>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-[var(--dj-bg)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,transparent_30%,rgba(0,0,0,.55)_100%)]" />

        <header className="relative z-10 flex items-center justify-between px-5 py-6 sm:px-10">
          <a href="/daniel-jenkins" aria-label="Back to top" className="dj-poster flex h-11 w-11 items-center justify-center rounded-full border border-[var(--dj-cream)]/40 text-lg">DJ</a>
          <nav className="hidden items-center gap-8 text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--dj-cream)]/75 md:flex">
            <a href="#showreels" className="hover:text-[var(--dj-amber)]">Showreels</a>
            <a href="#story" className="hover:text-[var(--dj-amber)]">Story</a>
            <a href="#road" className="hover:text-[var(--dj-amber)]">Experience</a>
            <a href="#contact" className="hover:text-[var(--dj-amber)]">Contact</a>
          </nav>
          <a href="/" className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--dj-cream)]/70 hover:text-[var(--dj-cream)]">
            All The Glory ↗
          </a>
        </header>

        <div className="relative z-10 mt-auto px-5 pb-10 sm:px-10 md:pb-14">
          <Reveal delay={0.5} y={20}>
            <p className="dj-serif mb-3 text-2xl italic text-[var(--dj-cream)]/85 sm:text-3xl md:text-right">
              Singer, songwriter &amp; lead guitarist
            </p>
          </Reveal>
          <h1 className="dj-poster text-[clamp(5rem,17vw,17rem)] leading-[0.82] md:text-right">
            <RiseWords words={["Daniel", "Jenkins"]} delay={0.15} />
          </h1>
          <Reveal delay={1} y={20}>
            <div className="mt-8 flex flex-col gap-6 border-t border-[var(--dj-line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-sm leading-relaxed text-[var(--dj-cream)]/70">
                Harare, Zimbabwe. Performing worldwide since 2013, from Cape Town stages to luxury ships across 30+ countries.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#showreels" className="dj-btn bg-[var(--dj-rust)] text-white hover:bg-[var(--dj-cream)] hover:text-[var(--dj-bg)]">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  Watch live
                </a>
                <a href="#contact" className="dj-btn border border-[var(--dj-cream)]/35 hover:bg-[var(--dj-cream)] hover:text-[var(--dj-bg)]">
                  Book Daniel
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── Marquee ───────── */}
      <div className="relative z-10 -rotate-1 scale-[1.02] border-y border-black/20 bg-[var(--dj-rust)] py-4 text-[var(--dj-cream)]" aria-hidden>
        <div className="dj-marquee">
          {[0, 1].map((k) => (
            <div key={k} className="flex items-center">
              {MARQUEE.map((m) => (
                <span key={m} className="dj-poster flex items-center gap-8 px-4 text-3xl sm:text-4xl">
                  {m}
                  <Star />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ───────── Showreels ───────── */}
      <section id="showreels" className="dj-glow relative scroll-mt-4 px-4 pb-24 pt-28 sm:px-10 md:pt-36">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <Kicker n="01">Live showreels</Kicker>
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <h2 className="dj-poster text-6xl leading-[0.9] sm:text-8xl">
                Watch him <span className="dj-serif normal-case italic text-[var(--dj-amber)]">live</span>
              </h2>
              <a href={CONTACT.youtube} target="_blank" rel="noopener noreferrer" className="dj-link pb-1 text-sm font-semibold">
                Full YouTube channel ↗
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <VideoReel reels={REELS} />
          </Reveal>
        </div>
      </section>

      {/* ───────── Numbers ───────── */}
      <section className="border-y border-[var(--dj-line)] px-4 sm:px-10">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
          {STATS.map((s, i) => (
            <div key={s.label} className={`py-12 md:py-16 ${i % 2 ? "pl-6 md:pl-10" : ""} ${i > 0 ? "md:border-l md:border-[var(--dj-line)] md:pl-10" : ""} ${i === 1 || i === 3 ? "border-l border-[var(--dj-line)]" : ""} ${i > 1 ? "border-t border-[var(--dj-line)] md:border-t-0" : ""}`}>
              <dd className="dj-poster text-6xl leading-none text-[var(--dj-cream)] sm:text-8xl">
                <CountUp to={s.to} suffix={s.suffix} />
              </dd>
              <dt className="dj-serif mt-3 text-xl italic text-[var(--dj-cream)]/60">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ───────── Story ───────── */}
      <section id="story" className="scroll-mt-4 px-4 py-28 sm:px-10 md:py-40">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
          <Reveal className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative aspect-[4/5] -rotate-2 overflow-hidden rounded-[28px] shadow-2xl">
              <Image src="/media/daniel/portrait.webp" alt="Daniel Jenkins smiling at a cafe table" fill sizes="(max-width: 1024px) 90vw, 45vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-10 -right-2 aspect-square w-[44%] rotate-3 overflow-hidden rounded-[20px] border-4 border-[var(--dj-bg)] shadow-2xl sm:-right-8">
              <Image src="/media/daniel/rooftop.webp" alt="Daniel Jenkins on a city rooftop" fill sizes="25vw" className="object-cover" />
            </div>
            {/* Spinning badge */}
            <div className="absolute -left-4 -top-8 h-28 w-28 sm:-left-8 sm:h-32 sm:w-32">
              <svg viewBox="0 0 100 100" className="dj-spin h-full w-full">
                <defs><path id="dj-circle" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" /></defs>
                <circle cx="50" cy="50" r="49" fill="#c8452c" />
                <text fontSize="10.5" fontWeight="700" letterSpacing="3.2" fill="#f3ebe0">
                  <textPath href="#dj-circle">LIVE · SINCE 2013 · LIVE · SINCE 2013 ·</textPath>
                </text>
              </svg>
              <span className="dj-poster absolute inset-0 flex items-center justify-center text-2xl">DJ</span>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <Kicker n="02">The story</Kicker>
              <h2 className="dj-serif text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
                From Cape Town bars to the <em className="text-[var(--dj-amber)]">ends of the earth</em>.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mt-10 space-y-5 text-[1.05rem] leading-[1.8] text-[var(--dj-cream)]/70">
                <p>
                  Daniel finished a diploma in Hotel Management in Cape Town at the end of 2013, then followed his dream of being
                  a singer-songwriter. In his first year he played hundreds of gigs across Cape Town, Durban, Victoria Falls and
                  Harare, and his own songs have since been played on South African and Zimbabwean radio.
                </p>
                <p>
                  A summer residency in Greece led to two years in the UAE with a four-piece band and a duo, then to Seabourn
                  Cruise Line, where he has led trios on guitar and vocals for over 500 shows, from Antarctica to Alaska.
                </p>
                <p>
                  Off the ships he plays solo in venues of every kind, with a repertoire that reads any room. People who work
                  with him talk about the same things: he builds real, lasting relationships, he&apos;s organised and reliable,
                  and he brings ideas that open new doors for a business.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── Now ───────── */}
      <section className="px-4 pb-28 sm:px-10 md:pb-40">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <Kicker n="03">Right now</Kicker>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                tag: "Currently",
                title: "Executive Manager",
                org: "2KO",
                href: "https://2ko.co.za",
                text: "Operational improvement, training and automation for businesses across Africa.",
                hot: true,
              },
              {
                tag: "As an artist",
                title: "All The Glory",
                org: "From Darkness To Light",
                href: "/",
                text: "His debut worship album and a daily chronological Bible study.",
              },
              {
                tag: "Previously",
                title: "Co-Founder",
                org: "Impart Global",
                href: "https://www.impart.global",
                text: "A creative tech company built to change the way fans and artists connect.",
              },
            ].map((c, i) => (
              <Reveal key={c.org} delay={i * 0.1}>
                <a
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={`group flex h-full flex-col rounded-[24px] border p-7 transition duration-500 hover:-translate-y-1 sm:p-9 ${
                    c.hot
                      ? "border-[var(--dj-rust)] bg-[var(--dj-rust)] text-white"
                      : "border-[var(--dj-line)] bg-white/[0.02] hover:border-[var(--dj-amber)]/50"
                  }`}
                >
                  <span className={`text-[11px] font-bold uppercase tracking-[0.35em] ${c.hot ? "text-white/80" : "text-[var(--dj-amber)]"}`}>{c.tag}</span>
                  <span className="dj-poster mt-8 text-4xl leading-none sm:text-5xl">{c.title}</span>
                  <span className="dj-serif mt-2 text-2xl italic opacity-90">{c.org}</span>
                  <span className={`mt-6 flex-1 text-sm leading-relaxed ${c.hot ? "text-white/85" : "text-[var(--dj-cream)]/60"}`}>{c.text}</span>
                  <span className="mt-8 text-xl transition group-hover:translate-x-1">↗</span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── The road ───────── */}
      <section id="road" className="scroll-mt-4 border-t border-[var(--dj-line)] px-4 py-28 sm:px-10 md:py-40">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <Kicker n="04">Experience</Kicker>
            <h2 className="dj-poster text-6xl leading-[0.9] sm:text-8xl lg:text-9xl">
              The <span className="dj-outline">road</span> so far
            </h2>
          </Reveal>
          <ol className="mt-16 border-t border-[var(--dj-line)]">
            {TOUR.map((t, i) => (
              <Reveal key={i} y={20} delay={i * 0.04}>
                <li className="dj-row grid grid-cols-[72px_1fr] items-baseline gap-x-4 gap-y-1 border-b border-[var(--dj-line)] px-2 py-6 sm:grid-cols-[120px_1.3fr_1fr_1fr] sm:px-4 sm:py-8">
                  <span className="dj-serif text-lg italic text-[var(--dj-cream)]/50 sm:text-xl">{t.years}</span>
                  <span className="dj-row-place dj-poster text-3xl leading-none transition-colors sm:text-5xl">{t.place}</span>
                  <span className="col-start-2 text-sm text-[var(--dj-cream)]/70 sm:col-start-auto">{t.role}</span>
                  <span className="col-start-2 text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--dj-amber)] sm:col-start-auto sm:text-right">{t.where}</span>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── Big nights ───────── */}
      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[70svh] overflow-hidden lg:min-h-[85svh]">
          <Image src="/media/daniel/stage.webp" alt="Daniel Jenkins with his electric guitar before a show" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover object-[30%_30%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--dj-bg)] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[var(--dj-bg)]" />
        </div>
        <div className="flex items-center px-5 py-20 sm:px-10 lg:px-16">
          <div className="w-full">
            <Reveal>
              <Kicker n="05">Big nights</Kicker>
              <h2 className="dj-serif text-5xl leading-[1.02] sm:text-6xl">
                Shared stages with <em className="text-[var(--dj-amber)]">the best</em>.
              </h2>
            </Reveal>
            <ul className="mt-12 space-y-8">
              {BIG_NIGHTS.map((b, i) => (
                <Reveal key={b.title} delay={i * 0.08} y={24}>
                  <li className="flex gap-6">
                    <span className="dj-poster text-4xl leading-none text-[var(--dj-rust)]">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="dj-poster text-2xl leading-tight">{b.title}</h3>
                      <p className="mt-1 text-[var(--dj-cream)]/60">{b.text}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── Kind words ───────── */}
      <section className="px-4 py-28 sm:px-10 md:py-40">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <Kicker n="06">Kind words</Kicker>
            <figure className="relative mt-20 sm:mt-28">
              <span className="dj-serif pointer-events-none absolute -left-2 -top-16 text-[12rem] leading-none text-[var(--dj-rust)]/40 sm:-top-24 sm:text-[18rem]" aria-hidden>
                &ldquo;
              </span>
              <blockquote className="dj-serif relative text-3xl leading-[1.2] sm:text-5xl lg:text-6xl">
                I&apos;ve seldom met someone who is able to adapt and learn at such a rapid pace,{" "}
                <em className="text-[var(--dj-amber)]">and maintain a standard of excellence in his work.</em>
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-4">
                <span className="h-px w-12 bg-[var(--dj-amber)]" />
                <span className="text-sm">
                  <strong className="font-bold">Liam Pitcher</strong>
                  <span className="text-[var(--dj-cream)]/55"> · Founder &amp; CEO, Impart Global</span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
          <div className="mt-20 grid gap-4 md:grid-cols-3">
            {SEABOURN.map((q, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <figure className="flex h-full flex-col rounded-[24px] border border-[var(--dj-line)] bg-white/[0.02] p-7">
                  <blockquote className="dj-serif flex-1 text-xl italic leading-snug text-[var(--dj-cream)]/85">&ldquo;{q}&rdquo;</blockquote>
                  <figcaption className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--dj-amber)]">Seabourn appraisal</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Photo band ───────── */}
      <section className="grid grid-cols-2 gap-1 md:grid-cols-[1fr_2fr]">
        <div className="relative aspect-square overflow-hidden">
          <Image src="/media/daniel/red-door.webp" alt="Daniel Jenkins at a red door with an acoustic guitar" fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover transition duration-[1.5s] hover:scale-105" />
        </div>
        <div className="relative aspect-square overflow-hidden md:aspect-auto">
          <Image src="/media/daniel/shadow.webp" alt="Daniel Jenkins walking through light and shadow with his guitar" fill sizes="(max-width: 768px) 50vw, 66vw" className="object-cover transition duration-[1.5s] hover:scale-105" />
        </div>
      </section>

      {/* ───────── Contact ───────── */}
      <section id="contact" className="relative scroll-mt-4 overflow-hidden px-4 pb-10 pt-28 sm:px-10 md:pt-40">
        <div className="dj-glow absolute inset-0" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <Kicker n="07">Bookings &amp; contracts</Kicker>
            <h2 className="dj-poster text-[clamp(4rem,14vw,13rem)] leading-[0.85]">
              Let&apos;s <span className="dj-outline">work</span>
              <br />
              together
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-14 grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
              {[
                { label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
                { label: "WhatsApp", value: CONTACT.whatsapp, href: CONTACT.whatsappHref },
                { label: "Call", value: CONTACT.phone, href: CONTACT.phoneHref },
              ].map((c, i) => (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={`group flex items-center justify-between gap-4 rounded-[20px] border px-6 py-6 transition duration-300 ${
                    i === 0
                      ? "border-[var(--dj-rust)] bg-[var(--dj-rust)] text-white hover:bg-[var(--dj-cream)] hover:text-[var(--dj-bg)]"
                      : "border-[var(--dj-line)] hover:border-[var(--dj-cream)] hover:bg-[var(--dj-cream)] hover:text-[var(--dj-bg)]"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.35em] opacity-70">{c.label}</span>
                    <span className="mt-1 block break-all text-base font-semibold lg:text-lg">{c.value}</span>
                  </span>
                  <span className="text-2xl transition group-hover:translate-x-1">→</span>
                </a>
              ))}
            </div>
          </Reveal>
          <div className="mt-24 flex flex-col gap-3 border-t border-[var(--dj-line)] pt-8 text-xs text-[var(--dj-cream)]/45 sm:flex-row sm:justify-between">
            <span>&copy; {new Date().getFullYear()} Daniel Jenkins · Harare, Zimbabwe</span>
            <span>
              <a href={CONTACT.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--dj-cream)]">YouTube</a>
              {"  ·  "}
              <a href="/" className="hover:text-[var(--dj-cream)]">alltheglory.co.za</a>
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
