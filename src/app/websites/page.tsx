import { CONTACT, PROJECTS, type Project } from "./projects";
import { BigSentence, EnquiryForm, HeroWall, Venn, WordReveal, WorkScroller, WxCursor, WxNav, WxReveal } from "./parts";

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

function Card({ p, i }: { p: Project; i: number }) {
  const dove = p.logo.includes("logo-dove");
  const inner = (
    <>
      <div className="wx-card-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.shot} alt={`The ${p.name} website`} />
        <span className="wx-card-no">{String(i + 1).padStart(2, "0")}</span>
        {!p.url && <span className="wx-card-soon">Coming soon</span>}
      </div>
      <div className="wx-card-meta">
        <div className="wx-card-name">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.logo} alt="" className={dove ? "dove" : undefined} />
          <div className="min-w-0">
            <h3>{p.name}</h3>
            <span>{p.kind}</span>
          </div>
        </div>
        {p.url && (
          <span className="wx-card-go">
            Visit site <b>↗</b>
          </span>
        )}
      </div>
    </>
  );
  return p.url ? (
    <a href={p.url} target="_blank" rel="noopener noreferrer" className="wx-card" data-cursor="Visit" aria-label={`${p.name} - open the live site (new tab)`}>
      {inner}
    </a>
  ) : (
    <div className="wx-card" data-cursor="Soon">
      {inner}
    </div>
  );
}

export default function WebsitesPage() {
  return (
    <div className="wx">
      <WxReveal />
      <WxCursor />
      <WxNav />

      <main id="top">
        {/* ===== HERO ===== */}
        <section className="wx-hero">
          <HeroWall>
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
          </HeroWall>
          <div className="wx-hero-shade" />
          <div className="wx-hero-glow" />

          <div className="wx-wrap wx-hero-in">
            <h1 className="wx-h1">
              <span className="wx-line">
                <span>Beautiful,</span>
              </span>
              <span className="wx-line i1">
                <span>incredible</span>
              </span>
              <span className="wx-line i2">
                <span className="gold">websites.</span>
              </span>
            </h1>
            <div className="wx-hero-side wx-reveal" style={{ "--d": 6 } as React.CSSProperties}>
              <p>
                I design and build websites that make people stop, stay and get in touch - for businesses, brands and people
                who want to stand out.
              </p>
              <a href="#contact" className="wx-pill wx-pill-gold">
                Start your website
              </a>
            </div>
          </div>

          <div className="wx-hero-foot">
            <div className="wx-wrap">
              <a href="#work" className="wx-scroll wx-micro">
                <span className="wx-scroll-ring" aria-hidden="true" />
                <span className="hidden sm:inline">Scroll to explore</span>
              </a>
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
        <WorkScroller>
          <div className="wx-work-intro">
            <p className="wx-micro">Selected work · {String(PROJECTS.length).padStart(2, "0")}</p>
            <h2 className="wx-h2">Websites I&apos;ve built</h2>
            <p className="wx-body">Click any project to open the live site.</p>
          </div>
          {PROJECTS.map((p, i) => (
            <Card key={p.key} p={p} i={i} />
          ))}
        </WorkScroller>

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
          <i>●</i>
          <span>Beautiful websites</span>
        </BigSentence>

        {/* ===== CONTACT ===== */}
        <section className="wx-contact" id="contact">
          <div className="wx-wrap">
            <div className="wx-call wx-reveal" aria-hidden="true" />
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
          </div>
        </section>
      </main>

      <footer className="wx-foot">
        <div className="wx-foot-run" aria-hidden="true">
          {[0, 1].map((n) => (
            <span key={n}>Let&apos;s build something beautiful ● Let&apos;s build something beautiful ●</span>
          ))}
        </div>
        <div className="wx-wrap">
          <div className="wx-foot-cols">
            <div>
              <a href="#work">Work</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </div>
            <div>
              <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
              <a href={CONTACT.emailHref}>Email</a>
            </div>
            <div>
              <a href="#top">Back to top ↑</a>
            </div>
          </div>
          <div className="wx-foot-base">
            <span>© {new Date().getFullYear()} Daniel Jenkins</span>
            <span>Websites for businesses, brands &amp; people</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
