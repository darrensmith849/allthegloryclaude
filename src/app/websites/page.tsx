import { Fragment } from "react";
import { CONTACT, PROJECTS } from "./projects";
import { CopyEmail, Preview, Reveal, RiseLines } from "./motion";

// /websites - Daniel's web design page: a standalone share link on the
// All The Glory domain. The album site's nav, footer, socials and music
// player are hidden here (see components/site/*). Fonts and link-preview
// details come from ./layout.tsx, the sites from ./projects.ts.
//
// One look throughout - Daniel's own, the same family as /daniel-jenkins:
// warm paper, ink, a rust accent, editorial serif. Each site is a row in
// an index that opens the live site in a new tab, with a small window
// playing a scroll-through of it. No prices - pricing is a private chat.

const STEPS = [
  {
    title: "Say hello",
    body: "Message me on WhatsApp or email. Tell me about you, your business and what you'd love your website to do.",
  },
  {
    title: "Design & build",
    body: "I design it around you and build it from scratch. You see it come together, and we shape it until it feels right.",
  },
  {
    title: "Go live",
    body: "We launch it on your own web address, looking sharp on phones and computers alike.",
  },
];

function WhatsAppIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.01c0-5.2 4.24-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.7 5.8.7 12.07c0 2 .52 3.95 1.52 5.67L.6 23.65l6.05-1.59a11.3 11.3 0 0 0 5.4 1.38h.01c6.26 0 11.35-5.09 11.36-11.35 0-3.03-1.18-5.89-3.33-8.03" />
    </svg>
  );
}

function Mail({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </svg>
  );
}

export default function WebsitesPage() {
  const live = PROJECTS.filter((p) => p.url).length;
  return (
    <main className="ws relative min-h-screen overflow-x-clip">
      <style>{`
        .ws {
          --bg:#ece5d9; --ink:#181512; --muted:#6f665c; --faint:#998f83; --line:rgba(24,21,18,.14);
          --dark:#13110f; --paper:#ece5d9; --dmuted:rgba(236,229,217,.6); --dline:rgba(236,229,217,.14);
          --accent:#9a3220; --accent-l:#d9774f; --wa:#25d366;
          --pad: clamp(20px, 5vw, 88px);
          --max: 1320px;
          --section: clamp(88px, 11vw, 168px);
          --bar-h: 72px;
          background: var(--bg); color: var(--ink);
          font-family: var(--ws-sans), system-ui, sans-serif;
          font-size: clamp(15px, .5vw + 13px, 17px);
          -webkit-font-smoothing: antialiased;
        }
        .ws ::selection { background: var(--accent); color: #fff; }
        .ws-wrap { width:100%; max-width: calc(var(--max) + var(--pad) * 2); margin-inline:auto; padding-inline: var(--pad); }
        .ws-serif { font-family: var(--ws-serif), Georgia, serif; font-weight:400; letter-spacing:-.015em; }
        .ws-mono { font-family: var(--ws-mono), ui-monospace, monospace; }
        .ws-label { font-family: var(--ws-mono), ui-monospace, monospace; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color: var(--muted); }

        .ws-bar { position:fixed; inset-inline:0; top:0; z-index:40; height:var(--bar-h);
          background: color-mix(in oklab, var(--bg) 82%, transparent);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom:1px solid var(--line); }
        .ws-nav a:not(.ws-btn) { color: var(--muted); transition: color .2s; }
        .ws-nav a:not(.ws-btn):hover { color: var(--ink); }

        .ws-btn { display:inline-flex; align-items:center; justify-content:center; gap:.65em; white-space:nowrap;
          height:54px; padding:0 26px; border-radius:999px; font-weight:500; font-size:15px;
          transition: transform .25s cubic-bezier(.16,1,.3,1), background-color .25s, color .25s, border-color .25s; }
        .ws-btn:hover { transform: translateY(-2px); }
        .ws-btn-sm { height:40px; padding:0 18px; font-size:14px; }
        .ws-btn-ink { background: var(--ink); color: var(--paper); }
        .ws-btn-ink:hover { background: var(--accent); }
        .ws-btn svg.wa { color: var(--wa); }
        .ws-btn-line { border:1px solid rgba(24,21,18,.25); color: var(--ink); }
        .ws-btn-line:hover { border-color: var(--ink); }
        .ws-btn-paper { background: var(--paper); color: var(--ink); }
        .ws-btn-paper:hover { background:#fff; }
        .ws-btn-dline { border:1px solid rgba(236,229,217,.3); color: var(--paper); }
        .ws-btn-dline:hover { border-color: var(--paper); }
        .ws-dot { width:7px; height:7px; border-radius:99px; background: var(--wa); animation: ws-ping 2.4s infinite; }
        @keyframes ws-ping { 0% { box-shadow:0 0 0 0 rgba(37,211,102,.5);} 70% { box-shadow:0 0 0 8px rgba(37,211,102,0);} 100% { box-shadow:0 0 0 0 rgba(37,211,102,0);} }

        .ws-h1 { font-size: clamp(3.3rem, 10.4vw, 10.5rem); line-height:.9; letter-spacing:-.03em; }
        .ws-h1 em, .ws-h2 em { color: var(--accent); }
        .ws-h2 { font-size: clamp(2.6rem, 5.6vw, 5rem); line-height:.96; letter-spacing:-.02em; }
        .ws-lede { font-size: clamp(1.06rem, 1.25vw, 1.25rem); line-height:1.6; color: var(--muted); }

        .ws-marquee { display:flex; width:max-content; animation: ws-marquee 60s linear infinite; }
        @keyframes ws-marquee { to { transform: translateX(-50%); } }

        /* the index of sites */
        .ws-row { display:grid; grid-template-columns: minmax(0,1fr); gap: 22px; padding-block: clamp(32px, 4.5vw, 56px); border-top:1px solid var(--line); }
        .ws-index > :last-child .ws-row { border-bottom:1px solid var(--line); }
        @media (min-width: 900px) {
          .ws-row { grid-template-columns: minmax(0,1fr) minmax(0, 480px); column-gap: clamp(24px, 4vw, 64px); align-items:center; }
        }
        .ws-name { font-size: clamp(2.3rem, 4.4vw, 4rem); line-height:1; letter-spacing:-.02em; transition: color .3s; }
        .ws-fav { width:22px; height:22px; border-radius:5px; object-fit:contain; flex:none; }
        .ws-open { display:inline-flex; align-items:center; gap:10px; font-family: var(--ws-mono), ui-monospace, monospace; font-size:12px; letter-spacing:.14em; text-transform:uppercase; }
        .ws-open .ws-arrow { display:inline-grid; place-items:center; width:34px; height:34px; border-radius:99px; border:1px solid rgba(24,21,18,.25);
          transition: transform .35s cubic-bezier(.16,1,.3,1), background-color .3s, color .3s, border-color .3s; }
        a.ws-row:hover .ws-name { color: var(--accent); }
        a.ws-row:hover .ws-arrow { background: var(--accent); border-color: var(--accent); color:#fff; transform: rotate(45deg); }
        a.ws-row:hover .ws-prev { transform: translateY(-4px); box-shadow: 0 2px 0 rgba(0,0,0,.03), 0 34px 60px -26px rgba(24,21,18,.55); }
        a.ws-row:focus-visible { outline: 2px solid var(--accent); outline-offset: 6px; border-radius: 4px; }

        /* the small live window */
        .ws-prev { border-radius:12px; overflow:hidden; background:#1c1a17; border:1px solid rgba(24,21,18,.18);
          box-shadow: 0 2px 0 rgba(0,0,0,.03), 0 24px 50px -28px rgba(24,21,18,.5); transition: transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s; }
        .ws-prev-bar { display:flex; align-items:center; gap:10px; height:30px; padding:0 10px; background:#221f1b; }
        .ws-prev-dots { display:flex; gap:5px; flex:none; }
        .ws-prev-dots i { width:8px; height:8px; border-radius:99px; background:#4a443d; }
        .ws-prev-host { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:center; padding-right:34px;
          font-family: var(--ws-mono), ui-monospace, monospace; font-size:10.5px; color: rgba(236,229,217,.5); }
        .ws-prev-screen { position:relative; aspect-ratio:16/10; overflow:hidden; background:#1c1a17; }
        .ws-prev-wait { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px;
          font-family: var(--ws-serif), Georgia, serif; font-size:1.4rem; color: rgba(236,229,217,.55); }
        .ws-prev-wait img { width:28px; height:28px; border-radius:6px; object-fit:contain; }
        .ws-soon { display:inline-flex; align-items:center; gap:10px; height:34px; padding:0 14px; border-radius:99px; border:1px dashed rgba(24,21,18,.3);
          font-family: var(--ws-mono), ui-monospace, monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color: var(--muted); }

        .ws-step { border-top:1px solid var(--line); padding-top:24px; }

        .ws-dark { background: var(--dark); color: var(--paper); }
        .ws-dark .ws-label { color: var(--dmuted); }
        .ws-h-xl { font-size: clamp(3.4rem, 11vw, 11rem); line-height:.88; letter-spacing:-.03em; }
        .ws-h-xl em { color: var(--accent-l); }
        .ws-crow { border-top:1px solid var(--dline); }
        .ws-copy { height:30px; padding:0 12px; border-radius:99px; font-size:11px; letter-spacing:.1em; text-transform:uppercase;
          border:1px solid var(--dline); color: var(--dmuted); transition: color .2s, border-color .2s; }
        .ws-copy:hover { color: var(--paper); border-color: var(--paper); }

        @media (prefers-reduced-motion: reduce) { .ws-marquee, .ws-dot { animation:none; } }
      `}</style>

      {/* ───────── Top bar ───────── */}
      <header className="ws-bar">
        <div className="ws-wrap flex h-full items-center justify-between gap-6">
          <a href="#top" className="flex items-baseline gap-3">
            <span className="ws-serif text-[1.5rem] leading-none tracking-tight">Daniel Jenkins</span>
            <span className="ws-label hidden sm:inline">Websites</span>
          </a>
          <nav className="ws-nav flex items-center gap-7 text-[14px]">
            <a href="#work" className="hidden md:inline">
              Work
            </a>
            <a href="#contact" className="hidden md:inline">
              Contact
            </a>
            <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="ws-btn ws-btn-ink ws-btn-sm">
              <WhatsAppIcon size={16} className="wa" />
              Let&apos;s chat
            </a>
          </nav>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section id="top" className="pt-[calc(var(--bar-h)+clamp(48px,8vw,112px))]">
        <div className="ws-wrap">
          <Reveal y={12}>
            <div className="ws-label flex flex-wrap items-center justify-between gap-4">
              <span>Web design &amp; build</span>
              <span className="flex items-center gap-3">
                <span className="ws-dot" aria-hidden="true" />
                Taking on new projects
              </span>
            </div>
          </Reveal>
          <h1 className="ws-serif ws-h1 mt-[clamp(28px,4vw,56px)]">
            <RiseLines
              lines={[
                <Fragment key="1">
                  I make <em>websites</em>
                </Fragment>,
                "for companies",
                "& people.",
              ]}
            />
          </h1>
          <div className="mt-[clamp(36px,5vw,64px)] flex flex-col gap-8 border-t border-[var(--line)] pt-8 md:flex-row md:items-start md:justify-between">
            <Reveal delay={0.3} className="max-w-[34rem]">
              <p className="ws-lede">
                Custom websites, designed around you and built from scratch. Have a look at a few I&apos;ve made below - then
                let&apos;s talk about yours.
              </p>
            </Reveal>
            <Reveal delay={0.4}>
              <div className="flex flex-wrap gap-3">
                <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="ws-btn ws-btn-ink">
                  <WhatsAppIcon className="wa" />
                  WhatsApp me
                </a>
                <a href={CONTACT.emailHref} className="ws-btn ws-btn-line">
                  <Mail />
                  Email me
                </a>
              </div>
            </Reveal>
          </div>
        </div>

        {/* The sites' names, drifting past */}
        <div className="mt-[clamp(64px,8vw,120px)] overflow-hidden border-y border-[var(--line)] py-5" aria-hidden="true">
          <div className="ws-marquee">
            {[0, 1].map((n) => (
              <div key={n} className="flex shrink-0 items-center">
                {[...PROJECTS, ...PROJECTS].map((p, i) => (
                  <span key={`${p.key}-${i}`} className="flex items-center gap-10 pr-10">
                    <span className="ws-serif whitespace-nowrap text-[clamp(1.6rem,2.6vw,2.4rem)] italic leading-none">{p.name}</span>
                    <span className="text-[var(--accent)]">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Work ───────── */}
      <section id="work" className="pt-[var(--section)]">
        <div className="ws-wrap">
          <Reveal>
            <div className="flex items-end justify-between gap-6 pb-[clamp(32px,4vw,56px)]">
              <h2 className="ws-serif ws-h2">
                Sites I&apos;ve <em>built</em>
              </h2>
              <p className="ws-label pb-2 text-right">
                {live} live
                <br className="sm:hidden" />
                <span className="hidden sm:inline"> · </span>
                {PROJECTS.length - live} coming soon
              </p>
            </div>
          </Reveal>

          <div className="ws-index">
            {PROJECTS.map((p, i) => {
              const body = (
                <>
                  <div className="min-w-0">
                    <p className="ws-label flex items-center gap-3">
                      <span className="text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</span>
                      <span className="h-px w-6 bg-[var(--line)]" aria-hidden="true" />
                      {p.kind}
                    </p>
                    <h3 className="ws-serif ws-name mt-4 flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.icon} alt="" width={22} height={22} className="ws-fav" />
                      {p.name}
                    </h3>
                    <p className="mt-4 max-w-[30rem] leading-[1.65] text-[var(--muted)]">{p.blurb}</p>
                    <div className="mt-6">
                      {p.url ? (
                        <span className="ws-open">
                          <span className="ws-arrow" aria-hidden="true">
                            ↗
                          </span>
                          View site
                        </span>
                      ) : (
                        <span className="ws-soon">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                          Launching soon
                        </span>
                      )}
                    </div>
                  </div>
                  <Preview p={p} />
                </>
              );
              return (
                <Reveal key={p.key} y={20}>
                  {p.url ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ws-row"
                      aria-label={`${p.name} - view the live site (opens in a new tab)`}
                    >
                      {body}
                    </a>
                  ) : (
                    <div className="ws-row">{body}</div>
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section id="how" className="py-[var(--section)]">
        <div className="ws-wrap">
          <Reveal>
            <p className="ws-label">How it works</p>
            <h2 className="ws-serif ws-h2 mt-5 max-w-[14ch]">
              Simple, personal, <em>yours.</em>
            </h2>
          </Reveal>
          <div className="mt-[clamp(44px,5vw,80px)] grid gap-x-[clamp(24px,4vw,64px)] gap-y-12 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08} className="ws-step">
                <p className="ws-serif text-[2.6rem] italic leading-none text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="ws-serif mt-6 text-[2rem] leading-none">{s.title}</h3>
                <p className="mt-4 max-w-[24rem] leading-[1.7] text-[var(--muted)]">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Contact ───────── */}
      <section id="contact" className="ws-dark pt-[var(--section)]">
        <div className="ws-wrap">
          <Reveal>
            <p className="ws-label">Let&apos;s talk</p>
            <h2 className="ws-serif ws-h-xl mt-6">
              Let&apos;s build <em>yours.</em>
            </h2>
          </Reveal>
          <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-12 md:grid-cols-12 md:items-end">
            <Reveal className="md:col-span-5">
              <p className="max-w-[28rem] text-[1.1rem] leading-[1.65] text-[var(--dmuted)]">
                Every website is different, so pricing is a private conversation. Send me a message - tell me what you have
                in mind and we&apos;ll take it from there.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="min-w-0 md:col-span-7">
              <div className="ws-crow flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="ws-label">WhatsApp</p>
                  <p className="ws-serif mt-2 text-[1.9rem] leading-none">{CONTACT.whatsapp}</p>
                </div>
                <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="ws-btn ws-btn-paper self-start sm:self-auto">
                  <WhatsAppIcon className="wa" />
                  Chat on WhatsApp
                </a>
              </div>
              <div className="ws-crow flex flex-col gap-5 border-b border-[var(--dline)] py-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="ws-label">Email</p>
                  <p className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="ws-serif break-all text-[1.9rem] leading-none">{CONTACT.email}</span>
                    <CopyEmail email={CONTACT.email} />
                  </p>
                </div>
                <a href={CONTACT.emailHref} className="ws-btn ws-btn-dline self-start sm:self-auto">
                  <Mail />
                  Send an email
                </a>
              </div>
            </Reveal>
          </div>
        </div>
        <footer className="ws-wrap ws-mono mt-[var(--section)] flex flex-col gap-2 border-t border-[var(--dline)] py-8 text-[11px] uppercase tracking-[.14em] text-[var(--dmuted)] sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Daniel Jenkins</span>
          <span>Websites for companies &amp; people</span>
        </footer>
      </section>
    </main>
  );
}
