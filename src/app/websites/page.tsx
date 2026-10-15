import { Fragment } from "react";
import { CONTACT, PROJECTS, type Project } from "./projects";
import { EnquiryForm, TypedAddress, WxNav, WxReveal } from "./parts";

// /websites - Daniel's web design page, built on the same lines as the
// Manuchie site he loves (warm glow, big name, portrait, marquee, story,
// statement, work list, offers, enquiry form) in his own colours: All The
// Glory's deep ink and gold. Styles live in ./websites.css (all wx-).
//
// The sites he has built show as cards and rows with their own logos,
// linking out to the live sites - no screenshots. No prices: pricing is a
// private conversation.

const OFFERS = [
  { title: "Business websites", body: "A polished home for your company: who you are, what you offer, and an easy way for customers to reach you." },
  { title: "Personal & artist sites", body: "For musicians, creatives and professionals who want to be found, heard and remembered." },
  { title: "Ministries & nonprofits", body: "Share your message, your events and ways to give, in a place that feels like home." },
  { title: "Redesigns", body: "Already have a website that's showing its age? I'll redesign it and bring it up to date." },
];

const STEPS = [
  { title: "Say hello", body: "Message me and tell me about you, your work and what you'd love your website to do." },
  { title: "Design", body: "I design it around your story and the people you want to reach, and show you as it takes shape." },
  { title: "Build", body: "I build it from scratch and we refine it together until it feels exactly right." },
  { title: "Launch", body: "It goes live on your own web address, ready to share with the world." },
];

const INCLUDED = ["Mobile-ready design", "Your own web address", "WhatsApp & email buttons", "Ready for Google", "Smart link previews"];

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}

function Mark({ p, size = "lg" }: { p: Project; size?: "lg" | "sm" }) {
  const dove = p.logo.includes("logo-dove");
  return size === "lg" ? (
    <span className="wx-mark">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.logo} alt={`${p.name} logo`} className={dove ? "dove" : undefined} />
    </span>
  ) : (
    <span className="wx-ic">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.logo} alt="" className={dove ? "dove" : undefined} />
    </span>
  );
}

function Featured({ p, d }: { p: Project; d: number }) {
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      className="wx-feat wx-reveal"
      style={{ "--c": p.color, "--d": d } as React.CSSProperties}
      aria-label={`${p.name} - visit the site (opens in a new tab)`}
    >
      <div className="wx-feat-art">
        <Mark p={p} />
        <span className="wx-feat-host">{p.host}</span>
      </div>
      <div className="wx-feat-meta">
        <span className="wx-feat-k">{p.kind}</span>
        <h3>{p.name}</h3>
        <p>{p.blurb}</p>
        <span className="wx-feat-link">
          Visit site <span>↗</span>
        </span>
      </div>
    </a>
  );
}

export default function WebsitesPage() {
  const [first, second, ...rest] = PROJECTS;
  const names = PROJECTS.map((p) => p.name);
  return (
    <div className="wx">
      <WxReveal />
      <WxNav />

      <main id="top">
        {/* ===== HERO ===== */}
        <section className="wx-hero">
          <div className="wx-hero-glow" aria-hidden="true" />
          <div className="wx-hero-type">
            <p className="wx-eyebrow wx-reveal">
              <span className="wx-tick" aria-hidden="true" />
              Web designer · Developer
            </p>
            <h1 className="wx-name wx-reveal" style={{ "--d": 1 } as React.CSSProperties}>
              Daniel Jenkins
            </h1>
            <p className="wx-tagline wx-reveal" style={{ "--d": 2 } as React.CSSProperties}>
              Beautiful websites.
              <br />
              <em>Built with purpose.</em>
            </p>
            <p className="wx-sub wx-reveal" style={{ "--d": 3 } as React.CSSProperties}>
              I design and build custom websites for companies, ministries and people - from the first idea to the day it
              goes live, with every detail in between.
            </p>
            <div className="wx-cta wx-reveal" style={{ "--d": 4 } as React.CSSProperties}>
              <a href="#contact" className="wx-btn wx-btn-gold">
                Start a project
              </a>
              <a href="#work" className="wx-btn wx-btn-line">
                <Arrow />
                See my work
              </a>
            </div>
            <div className="wx-reveal" style={{ "--d": 5 } as React.CSSProperties}>
              <TypedAddress />
            </div>
          </div>
          <figure className="wx-photo wx-reveal" style={{ "--d": 2 } as React.CSSProperties}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/daniel/portrait.webp" alt="Daniel Jenkins" fetchPriority="high" />
            <figcaption>Daniel Jenkins - Web designer</figcaption>
          </figure>
        </section>

        {/* ===== MARQUEE ===== */}
        <div className="wx-marquee" aria-label="Sites I've built">
          <div className="wx-marquee-run">
            {[0, 1].map((copy) =>
              [...names, ...names].map((n, i) => (
                <Fragment key={`${copy}-${i}`}>
                  <span aria-hidden={copy === 1 || i >= names.length}>{n}</span>
                  <i aria-hidden="true">✦</i>
                </Fragment>
              )),
            )}
          </div>
        </div>

        {/* ===== STORY ===== */}
        <section className="wx-story" id="story">
          <figure className="wx-story-photo wx-reveal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/daniel/gallery-rooftop.webp" alt="Daniel Jenkins on a city rooftop" loading="lazy" />
          </figure>
          <div className="wx-story-copy">
            <p className="wx-sec wx-reveal">01 - The Story</p>
            <h2 className="wx-h-lg wx-reveal">
              A designer&apos;s eye,
              <br />
              <em>a songwriter&apos;s heart.</em>
            </h2>
            <p className="wx-reveal">
              I&apos;m <strong>Daniel Jenkins</strong> - a singer-songwriter who builds websites. Every site I make starts
              from a blank page, not a template, so it fits the people it&apos;s for and says exactly what they need it to say.
            </p>
            <p className="wx-reveal">
              So far that&apos;s meant a property website for <strong>Virgin Estate Agents</strong> in Zimbabwe, a bold new
              home for <strong>Endgame Strategy Lab</strong> in Johannesburg, a welcoming site for the Christian nonprofit{" "}
              <strong>CrossCoders</strong>, an artist site for producer <strong>Manuchie</strong> - and{" "}
              <strong>All The Glory</strong>, the home of my own album and Bible study.
            </p>
            <ul className="wx-facts wx-reveal">
              <li>
                <span>Based</span> Harare, Zimbabwe
              </li>
              <li>
                <span>Clients</span> Zimbabwe · South Africa
              </li>
              <li>
                <span>Builds</span> Businesses · Ministries · Artists
              </li>
            </ul>
          </div>
        </section>

        {/* ===== STATEMENT ===== */}
        <section className="wx-mantra">
          <figure className="wx-mantra-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/daniel/hero.webp" alt="Daniel Jenkins by a red door with his guitar" loading="lazy" />
          </figure>
          <div className="wx-mantra-type">
            <p className="wx-sec gold wx-reveal">The standard</p>
            <h2 className="wx-mantra-line wx-reveal">
              Every detail.
              <br />
              <em>Every screen.</em>
            </h2>
            <p className="wx-mantra-sub wx-reveal">
              Songs and websites have more in common than you&apos;d think: nothing should be there by accident. Your site
              should look beautiful, read clearly on a phone, and make it effortless for people to reach you.
            </p>
          </div>
        </section>

        {/* ===== WORK ===== */}
        <section className="wx-work" id="work">
          <div className="wx-work-head">
            <p className="wx-sec wx-reveal">02 - The Work</p>
            <h2 className="wx-h-lg wx-reveal">Sites I&apos;ve built.</h2>
            <p className="wx-note wx-reveal">Every one designed from scratch and live on the web. Tap a site to visit it.</p>
          </div>

          <div className="wx-work-grid">
            <Featured p={first} d={0} />
            <Featured p={second} d={1} />
          </div>

          <ol className="wx-records wx-reveal">
            {rest.map((p, i) => {
              const row = (
                <>
                  <span className="wx-yr">{String(i + 3).padStart(2, "0")}</span>
                  <Mark p={p} size="sm" />
                  <span>
                    <span className="wx-nm">{p.name}</span>
                    <span className="wx-wi">{p.url ? `${p.kind} · ${p.host}` : `${p.kind} · launching soon`}</span>
                  </span>
                  {p.url ? <span className="wx-go">↗</span> : <span className="wx-soon">Soon</span>}
                </>
              );
              return (
                <li key={p.key}>
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`${p.name} - visit the site (opens in a new tab)`}>
                      {row}
                    </a>
                  ) : (
                    <div>{row}</div>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="wx-incl wx-reveal">
            <span>Every site includes</span>
            {INCLUDED.map((t) => (
              <b key={t}>{t}</b>
            ))}
          </div>
        </section>

        {/* ===== SERVICES ===== */}
        <section className="wx-offers-sec" id="services">
          <div className="wx-offers-head">
            <p className="wx-sec gold wx-reveal">03 - Ways to work together</p>
            <h2 className="wx-h-lg wx-reveal">
              Bring an idea.
              <br />
              <em>Leave with a website.</em>
            </h2>
            <p className="wx-offers-note wx-reveal">Whatever you&apos;re building, it starts with a conversation. Here&apos;s what I make most often.</p>
            <a href="#contact" className="wx-btn wx-btn-gold wx-reveal">
              Start a project
            </a>
          </div>
          <ol className="wx-offers">
            {OFFERS.map((o, i) => (
              <li key={o.title} className="wx-reveal" style={{ "--d": i } as React.CSSProperties}>
                <span className="wx-offer-no">{String(i + 1).padStart(2, "0")}</span>
                <h3>{o.title}</h3>
                <p>{o.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="wx-how" id="how">
          <div className="wx-how-head">
            <p className="wx-sec wx-reveal">04 - How it works</p>
            <h2 className="wx-h-lg wx-reveal">
              Simple from <em>start to finish.</em>
            </h2>
          </div>
          <ol className="wx-steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="wx-reveal" style={{ "--d": i } as React.CSSProperties}>
                <span className="wx-yr">{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ===== CONTACT ===== */}
        <section className="wx-contact" id="contact">
          <div className="wx-contact-left">
            <p className="wx-sec wx-reveal">05 - Say hello</p>
            <h2 className="wx-h-xl wx-reveal">
              Let&apos;s build
              <br />
              <em>something that lasts.</em>
            </h2>
            <p className="wx-contact-sub wx-reveal">
              Tell me about your project and I&apos;ll reply myself. Every website is different, so pricing is a private
              conversation.
            </p>
            <div className="wx-direct wx-reveal">
              <a className="wx-cd" href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer">
                <span className="wx-cd-k">WhatsApp</span>
                <span className="wx-cd-v">{CONTACT.whatsapp}</span>
              </a>
              <a className="wx-cd" href={CONTACT.emailHref}>
                <span className="wx-cd-k">Email</span>
                <span className="wx-cd-v">{CONTACT.email}</span>
              </a>
            </div>
          </div>
          <EnquiryForm />
        </section>
      </main>

      <footer className="wx-foot">
        <div className="wx-foot-top">
          <span className="wx-foot-logo">Daniel Jenkins</span>
          <nav className="wx-foot-links" aria-label="Footer">
            <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
            <a href={CONTACT.emailHref}>Email</a>
            <a href="#work">Work</a>
            <a href="#top">Back to top ↑</a>
          </nav>
        </div>
        <div className="wx-foot-base">
          <span>Websites for companies, ministries &amp; people</span>
          <span className="wx-foot-mantra">Every detail. Every screen.</span>
          <span>© {new Date().getFullYear()} Daniel Jenkins</span>
        </div>
      </footer>
    </div>
  );
}
