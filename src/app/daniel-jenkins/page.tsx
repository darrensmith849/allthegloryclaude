import Image from "next/image";
import VideoReel, { type Reel } from "./video-reel";

// Daniel's personal resume page - a standalone share link that lives on the
// All The Glory domain. The site's nav, footer, socials and album player are
// hidden on /daniel-jenkins (see components/site/*).

const CONTACT = {
  email: "danieljenkinsofficial@gmail.com",
  phone: "+263 78 829 1503",
  phoneHref: "tel:+263788291503",
  whatsapp: "+27 84 665 1423",
  whatsappHref: "https://wa.me/27846651423",
  youtube: "https://www.youtube.com/danieljenkins92",
  impart: "https://www.impart.global",
};

const REELS: Reel[] = [
  { id: "do9D6ra6QT8", year: "2025", title: "Solo Live Showreel", note: "Solo set, including lead guitar" },
  { id: "HG1sJOBo2ko", year: "2025", title: "Baby Come Back", note: "Player cover - live recording" },
  { id: "-LCMQwrVxMU", year: "2023", title: "Solo Promo", note: "Filmed on board a cruise ship" },
  { id: "EdMA62ZW_E8", year: "2017", title: "Duo Performance", note: "Live in Dubai" },
  { id: "MPYOLi9gkoA", year: "2017", title: "Live Festival", note: "On stage in London" },
];

const STATS = [
  { value: "500+", label: "Performances at sea" },
  { value: "30+", label: "Countries" },
  { value: "5", label: "Continents" },
  { value: "10+", label: "Years performing" },
];

const EXPERIENCE = [
  { place: "Seabourn Odyssey", role: "Lead guitarist / vocalist in a trio", when: "May 2024 - Sep 2024", where: "Alaska, Japan" },
  { place: "Seabourn Odyssey", role: "Lead guitarist / vocalist in a trio", when: "Sep 2023 - Feb 2024", where: "Alaska, Australia, New Zealand" },
  { place: "Seabourn Odyssey", role: "Lead guitarist / vocalist in a trio", when: "Oct 2022 - May 2023", where: "Australia, French Polynesia, New Zealand" },
  { place: "Seabourn Quest", role: "Lead guitarist / vocalist in a trio", when: "Oct 2019 - Feb 2020", where: "Antarctica, Canada, North & South America" },
  { place: "Kempinski Hotel, Ajman", role: "Lead guitarist / vocalist in a duo", when: "Oct 2017 - Jan 2018", where: "United Arab Emirates" },
  { place: "Danat Al Ain Resort, Al Ain", role: "Lead guitarist / vocalist in a quartet", when: "Sep 2016 - Aug 2017", where: "United Arab Emirates" },
  { place: "Circus Taverna, Greece", role: "Resident performer", when: "Summer 2015", where: "Greece" },
];

const HIGHLIGHTS = [
  "Solo supporting act at the Electric Vines Concert, Cape Town (2014), alongside Jeremy Loops, Prime Circle, Matthew Mole and Goodluck",
  "Opened for Prime Circle in Harare (2015)",
  "Third place in Harare's Got Talent",
  "Original songs played on South African and Zimbabwean radio",
  "Hundreds of gigs in his first year across Cape Town, Durban, Victoria Falls and Harare",
];

const SKILLS = ["Recording Artist", "Singer & Songwriter", "Lead Guitarist", "Live Performer", "Creative Strategist", "Diploma in Hotel Management"];

const SEABOURN_WORDS = [
  "Daniel has settled in extremely well to ship life. He is very popular not only with his colleagues in the Entertainment Department but with the guests also. An excellent team member.",
  "Daniel has been a great asset to the team as a member of the Club trio. He is a good musician, also adds to the vocal variety of the group.",
  "Daniel is a very good performer, singer and guitarist. He is very friendly with both guests and crew, a true team player. He practices constantly, always working to improve his performance.",
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#e0a96d]">{children}</p>;
}

export default function DanielJenkinsPage() {
  return (
    <main className="dj relative min-h-screen bg-[#0d0b0a] text-white/85">
      <style>{`
        .dj-noscroll { scrollbar-width: none; }
        .dj-noscroll::-webkit-scrollbar { display: none; }
        .dj-arrow { display:inline-flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:999px; border:1px solid rgba(255,255,255,.18); color:#fff; transition:background .2s, border-color .2s; }
        .dj-arrow:hover { background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.35); }
        .dj-btn { display:inline-flex; align-items:center; gap:.5rem; border-radius:999px; padding:.8rem 1.4rem; font-weight:600; font-size:.95rem; transition:transform .2s, background .2s; }
        .dj-btn:hover { transform:translateY(-1px); }
      `}</style>

      {/* Top bar */}
      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-5 sm:px-8 lg:px-16">
        <span className="font-display text-lg text-white">Daniel Jenkins</span>
        <a href="/" className="text-xs uppercase tracking-[0.25em] text-white/60 transition hover:text-white">
          All The Glory
        </a>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[92svh] items-end overflow-hidden">
        <Image
          src="/media/daniel/hero.webp"
          alt="Daniel Jenkins sitting by a red door with his guitar"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[22%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b0a] via-[#0d0b0a]/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/50 max-md:hidden" />
        <div className="relative z-10 w-full px-4 pb-14 sm:px-8 lg:px-16 md:pb-20">
          <div className="md:ml-auto md:max-w-xl md:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#e0a96d]">Harare, Zimbabwe</p>
            <h1 className="mt-3 font-display text-6xl leading-[0.95] text-white sm:text-7xl lg:text-8xl">
              Daniel
              <br />
              Jenkins
            </h1>
            <p className="mt-5 text-lg text-white/80">
              Recording artist, singer-songwriter, lead guitarist and live performer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 md:justify-end">
              <a href="#showreels" className="dj-btn bg-[#c4462f] text-white hover:bg-[#d4553c]">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                Watch showreels
              </a>
              <a href="#contact" className="dj-btn border border-white/25 text-white hover:bg-white/10">
                Get in touch
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:px-8 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="px-2 py-8 text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-4xl text-white sm:text-5xl">{s.value}</dd>
              <dd className="mt-2 text-xs uppercase tracking-[0.2em] text-white/50">{s.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Showreels */}
      <section id="showreels" className="scroll-mt-6 py-20 sm:py-28">
        <div className="px-4 sm:px-8 lg:px-16">
          <Eyebrow>Live showreels</Eyebrow>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-4xl text-white sm:text-5xl">See him play</h2>
            <a href={CONTACT.youtube} target="_blank" rel="noopener noreferrer" className="text-sm text-white/60 underline-offset-4 hover:text-white hover:underline">
              More on YouTube
            </a>
          </div>
          <p className="mt-3 max-w-xl text-white/60">Tap a video to play it. Swipe or use the arrows to move across.</p>
        </div>
        <div className="mt-8">
          <VideoReel reels={REELS} />
        </div>
      </section>

      {/* About */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-8 md:grid-cols-[5fr_7fr] md:py-24">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl md:max-w-none">
          <Image src="/media/daniel/portrait.webp" alt="Daniel Jenkins smiling at a cafe table" fill sizes="(max-width: 768px) 90vw, 40vw" className="object-cover" />
        </div>
        <div>
          <Eyebrow>About</Eyebrow>
          <h2 className="font-display text-4xl leading-tight text-white sm:text-5xl">A performer who builds real connection</h2>
          <div className="mt-6 space-y-4 text-[1.05rem] leading-relaxed text-white/70">
            <p>
              Daniel earned a diploma in Hotel Management in Cape Town at the end of 2013 and has since followed his dream of
              being a singer-songwriter. He keeps writing and releasing songs, some of which have been played on South African
              and Zimbabwean radio.
            </p>
            <p>
              He established himself quickly as a performer, playing hundreds of gigs in his first year. Since then he has
              performed in Greece, spent two years in the UAE with a four-piece band and a duo, and joined Seabourn Cruise Line,
              where he has played over 500 shows as lead guitarist and vocalist across 30+ countries on 5 continents.
            </p>
            <p>
              Away from the ships he performs solo at venues of every kind, with a wide repertoire for any room. He is also the
              Co-Founder of{" "}
              <a href={CONTACT.impart} target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">
                Impart Global
              </a>
              , a creative company changing the way fans and artists connect, and the voice behind{" "}
              <a href="/" className="text-white underline underline-offset-4">All The Glory</a>.
            </p>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2">
            {SKILLS.map((s) => (
              <li key={s} className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/75">{s}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Experience */}
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-8 md:grid-cols-[7fr_5fr] md:py-24">
        <div>
          <Eyebrow>Experience</Eyebrow>
          <h2 className="font-display text-4xl text-white sm:text-5xl">On stage around the world</h2>
          <ol className="mt-10 border-l border-white/15">
            {EXPERIENCE.map((e, i) => (
              <li key={i} className="relative pb-8 pl-7 last:pb-0">
                <span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-[#c4462f]" />
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">{e.when}</p>
                <h3 className="mt-1 font-display text-xl text-white sm:text-2xl">{e.place}</h3>
                <p className="mt-1 text-white/70">{e.role}</p>
                <p className="text-sm text-white/45">{e.where}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-6 md:pt-24">
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl">
            <Image src="/media/daniel/stage.webp" alt="Daniel Jenkins with his electric guitar before a show" fill sizes="(max-width: 768px) 90vw, 35vw" className="object-cover" />
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="font-display text-xl text-white">Highlights</h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/70">
              {HIGHLIGHTS.map((h) => (
                <li key={h} className="flex gap-3">
                  <span className="mt-2 h-1 w-3 shrink-0 bg-[#e0a96d]" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Photo strip */}
      <section className="grid grid-cols-2 gap-2 px-2 md:grid-cols-[1fr_1fr_2fr]">
        {[
          { src: "/media/daniel/red-door.webp", alt: "Daniel Jenkins at a red door with an acoustic guitar" },
          { src: "/media/daniel/rooftop.webp", alt: "Daniel Jenkins on a city rooftop" },
        ].map((p) => (
          <div key={p.src} className="relative aspect-square overflow-hidden">
            <Image src={p.src} alt={p.alt} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
          </div>
        ))}
        <div className="relative col-span-2 aspect-[16/10] overflow-hidden md:col-span-1 md:aspect-auto">
          <Image src="/media/daniel/shadow.webp" alt="Daniel Jenkins walking through light and shadow with his guitar" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        </div>
      </section>

      {/* Kind words */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8 md:py-28">
        <Eyebrow>Kind words</Eyebrow>
        <h2 className="font-display text-4xl text-white sm:text-5xl">What people say</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {SEABOURN_WORDS.map((q, i) => (
            <figure key={i} className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <blockquote className="flex-1 leading-relaxed text-white/75">&ldquo;{q}&rdquo;</blockquote>
              <figcaption className="mt-5 text-xs uppercase tracking-[0.2em] text-[#e0a96d]">Seabourn appraisal</figcaption>
            </figure>
          ))}
        </div>
        <figure className="mt-5 rounded-3xl border border-white/10 bg-gradient-to-br from-[#c4462f]/15 to-transparent p-6 sm:p-10">
          <blockquote className="font-display text-xl leading-relaxed text-white sm:text-2xl">
            &ldquo;I&apos;ve seldom met someone who is able to adapt and learn at such a rapid pace wherever required, and maintain a
            standard of excellence in his work. I highly recommend him for any jobs to do with relationships, creative marketing
            and music.&rdquo;
          </blockquote>
          <figcaption className="mt-6 text-sm text-white/60">
            <span className="text-white">Liam Pitcher</span> - Founder &amp; CEO, Impart Global
          </figcaption>
        </figure>
      </section>

      {/* Contact */}
      <section id="contact" className="relative overflow-hidden border-t border-white/10">
        <Image src="/media/daniel/shadow.webp" alt="" fill sizes="100vw" className="object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0b0a] via-[#0d0b0a]/70 to-[#0d0b0a]" />
        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-8 md:py-32">
          <Eyebrow>Contact</Eyebrow>
          <h2 className="font-display text-4xl text-white sm:text-6xl">Let&apos;s work together</h2>
          <p className="mx-auto mt-4 max-w-lg text-white/65">For bookings, contracts and collaborations.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href={`mailto:${CONTACT.email}`} className="dj-btn bg-[#c4462f] text-white hover:bg-[#d4553c]">Email Daniel</a>
            <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="dj-btn border border-white/25 text-white hover:bg-white/10">
              WhatsApp
            </a>
            <a href={CONTACT.phoneHref} className="dj-btn border border-white/25 text-white hover:bg-white/10">Call</a>
          </div>
          <div className="mt-10 space-y-1 text-sm text-white/50">
            <p>{CONTACT.email}</p>
            <p>{CONTACT.phone} &middot; WhatsApp {CONTACT.whatsapp}</p>
          </div>
        </div>
        <p className="relative pb-8 text-center text-xs text-white/35">
          &copy; {new Date().getFullYear()} Daniel Jenkins &middot; <a href="/" className="hover:text-white">alltheglory.co.za</a>
        </p>
      </section>
    </main>
  );
}
