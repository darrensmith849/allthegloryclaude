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
                    <img key={k} src={`${W}/wall-${n}.webp`} alt="" />
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
              <img src={`${W}/manuchie-shot.webp`} alt="" />
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
              <img src="/media/logo-dove-440.webp" alt="" />
            </div>
            <h2 className="wx-h2 wx-reveal">Let&apos;s build yours.</h2>
            <p className="wx-body wx-contact-sub wx-reveal">
              Tell me a little about your idea and I&apos;ll get back to you personally. Every project is different, so pricing
              is a private conversation.
            </p>
            <EnquiryForm />
            <div className="wx-direct wx-reveal">
              <span>
                WhatsApp{" "}
                <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer">
                  {CONTACT.whatsapp}
                </a>
              </span>
              <span>
                Email <a href={CONTACT.emailHref}>{CONTACT.email}</a>
              </span>
            </div>
            <p className="wx-sign">© {new Date().getFullYear()} Daniel Jenkins · Websites for businesses, brands &amp; people</p>
          </div>
        </section>
      </main>
    </div>
  );
}
