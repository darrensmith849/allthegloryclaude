import { CONTACT, PROJECTS } from "./projects";
import { BigSentence, EnquiryForm, HeroLayer, Venn, WordReveal, WorkOrbit, WxClicks, WxNav, WxReveal } from "./parts";

// /websites - Daniel's page for selling the websites he builds, modelled on
// weareheroes.one and made his own: deep blue-black, plain light type, his
// gold, glowing pills and line-art circles that draw as you scroll. Real
// screenshots of his sites are the imagery - a slow wall of them behind the
// hero, and one per site in the work gallery, each linking to the live site.
// Styles: ./websites.css (all wx-). No prices - that's a private chat.

const W = "/media/websites";
const WALL = [
  ["00", "03", "06", "09"],
  ["01", "04", "07", "10"],
  ["02", "05", "08", "11"],
  ["12", "09", "04", "07"],
];

const STEPS = [
  { title: "Listen", body: "We talk about your goals, your style and the people you want to reach." },
  { title: "Design", body: "I create a look that's unique to you, and share it as it comes together." },
  { title: "Build", body: "I build it from scratch - fast, secure and ready for every screen." },
  { title: "Launch", body: "Your site goes live on your own address, ready to share." },
];

export default function WebsitesPage() {
  return (
    <div className="wx">
      <WxReveal />
      <WxClicks />
      <WxNav />

      <main id="top">
        {/* ===== HERO ===== */}
        <section className="wx-hero">
          <HeroLayer className="wx-wall-holder">
            <div className="wx-wall">
              {WALL.map((col, c) => (
                <div key={c} className="wx-wall-col">
                  {[...col, ...col].map((n, k) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={k} src={`${W}/wall-${n}.webp`} alt="" decoding="async" />
                  ))}
                </div>
              ))}
            </div>
          </HeroLayer>
          <div className="wx-hero-shade" />
          <div className="wx-hero-glow" />
          {/* Manuchie, front and centre in the background */}
          <HeroLayer className="wx-feature-holder" speed={120} fade={0.5}>
            <div className="wx-feature">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${W}/manuchie-shot.webp`} alt="" fetchPriority="high" />
            </div>
          </HeroLayer>

          <div className="wx-wrap wx-hero-in">
            <h1 className="wx-h1">
              <span className="wx-line">
                <span>Websites</span>
              </span>
              <span className="wx-line i1">
                <span>that stop</span>
              </span>
              <span className="wx-line i2">
                <span className="gold">the scroll.</span>
              </span>
            </h1>
            <div className="wx-hero-side wx-reveal" style={{ "--d": 6 } as React.CSSProperties}>
              <p>
                I design and build websites that turn a first glance into a first call - for businesses, brands and people who
                want to stand out.
              </p>
              <a href="#contact" className="wx-pill wx-pill-gold">
                Start your website
              </a>
            </div>
          </div>

          <div className="wx-hero-foot">
            <div className="wx-wrap">
              <span className="wx-micro">Web design &amp; development</span>
            </div>
          </div>
        </section>

        {/* ===== DESIGN + BUILD ===== */}
        <Venn />

        {/* ===== STATEMENT ===== */}
        <section className="wx-state">
          <div className="wx-wrap">
            <p className="wx-micro wx-reveal">Why it matters</p>
            <div className="mt-8">
              <WordReveal
                text="Your website is often the first impression people have of you. I make sure it's a beautiful one."
                gold={["beautiful"]}
              />
            </div>
            <div className="wx-state-cols">
              <p className="wx-body wx-reveal">
                Every website I build is designed from scratch around your brand - no templates, no shortcuts. It looks right on
                every phone, tablet and computer.
              </p>
              <p className="wx-body wx-reveal" style={{ "--d": 1 } as React.CSSProperties}>
                And it&apos;s built to work: quick to load, ready to be found on Google, and simple for people to reach you on
                WhatsApp or email.
              </p>
            </div>
          </div>
        </section>

        {/* ===== WORK ===== */}
        <WorkOrbit projects={PROJECTS} />

        {/* ===== ABOUT ===== */}
        <section className="wx-about" id="about">
          <div className="wx-wrap wx-about-in">
            <div className="wx-about-copy">
              <p className="wx-micro wx-reveal">The designer</p>
              <h2 className="wx-h2 wx-reveal">Hi, I&apos;m Daniel.</h2>
              <p className="wx-body wx-reveal">
                I design and build every website myself - from the first conversation to the day it goes live. You always know
                who&apos;s looking after your project, and every detail gets the care it deserves.
              </p>
              <p className="wx-body wx-reveal">
                I&apos;ve built websites for property agents, a marketing consultancy, a Christian nonprofit, musicians and
                ministries across Zimbabwe and South Africa.
              </p>
              <a href="#contact" className="wx-pill wx-pill-gold wx-reveal">
                Let&apos;s work together
              </a>
            </div>
            <div className="wx-orbit wx-reveal" style={{ "--d": 2 } as React.CSSProperties}>
              <span className="wx-orbit-ring r3" />
              <span className="wx-orbit-ring r2" />
              <span className="wx-orbit-ring" />
              <span className="wx-orbit-dot" />
              <div className="wx-orbit-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/media/daniel/portrait.webp" alt="Daniel Jenkins" loading="lazy" />
              </div>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="wx-how" id="how">
          <div className="wx-wrap">
            <div className="wx-how-head">
              <p className="wx-micro wx-reveal">How it works</p>
              <h2 className="wx-h2 wx-reveal">Four simple steps</h2>
            </div>
            <ol className="wx-circles">
              {STEPS.map((s, i) => (
                <li key={s.title} className="wx-circle wx-reveal" style={{ "--d": i } as React.CSSProperties}>
                  <span className="wx-circle-no">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ===== BIG SENTENCE ===== */}
        <BigSentence>
          <span>Beautiful websites</span>
          <i>●</i>
          <span>built from scratch</span>
          <i>●</i>
          <span>
            made to be <span className="gold">remembered</span>
          </span>
        </BigSentence>


        {/* ===== CONTACT ===== */}
        <section className="wx-contact" id="contact">
          <div className="wx-wrap">
            <div className="wx-call wx-reveal" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/media/logo-dove-440.webp" alt="" loading="lazy" decoding="async" />
            </div>
            <h2 className="wx-h2 wx-reveal">Let&apos;s build yours.</h2>
            <p className="wx-body wx-contact-sub wx-reveal">
              Tell me a little about your idea and I&apos;ll get back to you personally. Every project is different, so pricing
              is a private conversation.
            </p>
            <EnquiryForm />
            <div className="wx-direct wx-reveal">
              <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${CONTACT.whatsapp}`} title="WhatsApp">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6A12 12 0 0 0 12 24c6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.5-8.5ZM12 21.8c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 0 1 2.2 12C2.2 6.6 6.6 2.2 12 2.2c2.6 0 5.1 1 6.9 2.9a9.7 9.7 0 0 1 2.9 6.9c0 5.4-4.4 9.8-9.8 9.8Zm5.4-7.3c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1l-.9 1.2c-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5v-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3Z" />
                </svg>
              </a>
              <a href={CONTACT.emailHref} aria-label={`Email ${CONTACT.email}`} title="Email">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="line">
                  <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
                  <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
                </svg>
              </a>
              <a href={CONTACT.instagramHref} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${CONTACT.instagram}`} title="Instagram">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="line">
                  <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
                  <circle cx="12" cy="12" r="4.5" />
                  <circle cx="17.4" cy="6.6" r="1.2" className="dot" />
                </svg>
              </a>
              <a href={CONTACT.linkedinHref} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn - Daniel Jenkins" title="LinkedIn">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
                </svg>
              </a>
            </div>
            <p className="wx-sign">© {new Date().getFullYear()} Daniel Jenkins · Websites for businesses, brands &amp; people</p>
          </div>
        </section>
      </main>
    </div>
  );
}
