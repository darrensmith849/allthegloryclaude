import { CONTACT, PROJECTS } from "./projects";
import { CopyEmail, ProjectMedia, Showreel } from "./screens";
import { Reveal, TintWatcher } from "./motion";

// /websites - Daniel's web design showcase: a standalone share link that
// lives on the All The Glory domain. The album site's nav, footer, socials
// and music player are hidden here (see components/site/*). Fonts and
// link-preview details come from ./layout.tsx, the sites from ./projects.ts.
//
// The page glow (--tint) takes on the colour of whichever site is on
// screen, so the page quietly changes character as you move through the
// work. No prices anywhere - pricing is a private conversation.

const STEPS = [
  {
    title: "Say hello",
    body: "Message me on WhatsApp or email. Tell me about you, your business and what you'd love your website to do.",
  },
  {
    title: "Design & build",
    body: "I design it around you and build it from scratch - no templates. You'll see it come together, and we shape it until it feels right.",
  },
  {
    title: "Go live",
    body: "We launch it on your own web address, looking sharp on phones and computers alike.",
  },
];

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
  const live = PROJECTS.filter((p) => p.url);
  return (
    <main className="ws relative min-h-screen overflow-x-clip">
      <style>{`
        @property --tint { syntax: "<color>"; inherits: true; initial-value: #6fae8f; }
        .ws {
          --bg:#0c0b0a; --ink:#f2efe9; --muted:#9a958d; --faint:#67625b; --line:rgba(242,239,233,.09);
          --paper:#eeeae2; --paper-ink:#15130f; --paper-muted:#6b655c; --paper-line:rgba(21,19,15,.13);
          --wa:#25d366;
          --pad: clamp(20px, 5vw, 80px);
          --max: 1240px;
          --section: clamp(96px, 12vw, 176px);
          --bar-h: 68px;
          background: var(--bg); color: var(--ink);
          font-family: var(--ws-sans), system-ui, sans-serif;
          font-size: clamp(15px, .5vw + 13px, 17px);
          transition: --tint 1.4s ease;
          -webkit-font-smoothing: antialiased;
        }
        .ws ::selection { background: var(--tint); color: #0c0b0a; }
        .ws-wrap { width:100%; max-width: calc(var(--max) + var(--pad) * 2); margin-inline:auto; padding-inline: var(--pad); }
        .ws-serif { font-family: var(--ws-serif), Georgia, serif; font-weight:400; letter-spacing:-.015em; }
        .ws-mono { font-family: var(--ws-mono), ui-monospace, monospace; }
        .ws-label { font-family: var(--ws-mono), ui-monospace, monospace; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color: var(--muted); }
        .ws-accent { color: color-mix(in oklab, var(--tint) 78%, #fff); }

        /* glow that takes the colour of the site on screen */
        .ws-glow { position:fixed; inset:0; pointer-events:none; z-index:0;
          background:
            radial-gradient(60% 50% at 50% -8%, color-mix(in oklab, var(--tint) 24%, transparent), transparent 72%),
            radial-gradient(40% 45% at 100% 105%, color-mix(in oklab, var(--tint) 11%, transparent), transparent 75%),
            radial-gradient(35% 40% at 0% 60%, color-mix(in oklab, var(--tint) 6%, transparent), transparent 75%);
        }
        .ws-grid { position:fixed; inset:0; pointer-events:none; z-index:0; opacity:.5;
          background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px);
          background-size: 88px 88px; background-position: center top;
          mask-image: radial-gradient(70% 55% at 50% 0%, #000 0%, transparent 75%);
          -webkit-mask-image: radial-gradient(70% 55% at 50% 0%, #000 0%, transparent 75%);
        }

        /* top bar */
        .ws-bar { position:fixed; inset-inline:0; top:0; z-index:40; height:var(--bar-h);
          background: color-mix(in oklab, var(--bg) 72%, transparent);
          backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%);
          border-bottom:1px solid var(--line); }
        .ws-nav a:not(.ws-btn) { color: var(--muted); transition: color .2s; }
        .ws-nav a:not(.ws-btn):hover { color: var(--ink); }

        /* buttons */
        .ws-btn { display:inline-flex; align-items:center; justify-content:center; gap:.6em; white-space:nowrap;
          height:52px; padding:0 26px; border-radius:999px; font-weight:500; font-size:15px; letter-spacing:-.005em;
          transition: transform .25s cubic-bezier(.16,1,.3,1), background-color .25s, box-shadow .25s, color .25s, border-color .25s; }
        .ws-btn:hover { transform: translateY(-2px); }
        .ws-btn:active { transform: translateY(0); }
        .ws-btn-sm { height:40px; padding:0 18px; font-size:14px; }
        .ws-btn-wa { background: var(--wa); color:#04210f; box-shadow: 0 10px 30px -10px rgba(37,211,102,.55); }
        .ws-btn-wa:hover { background:#2fe274; box-shadow: 0 16px 40px -12px rgba(37,211,102,.7); }
        .ws-btn-line { border:1px solid rgba(242,239,233,.2); color: var(--ink); }
        .ws-btn-line:hover { border-color: rgba(242,239,233,.45); background: rgba(242,239,233,.05); }
        .ws-dot { width:7px; height:7px; border-radius:99px; background: var(--wa); box-shadow:0 0 0 0 rgba(37,211,102,.6); animation: ws-ping 2.4s infinite; }
        @keyframes ws-ping { 0% { box-shadow:0 0 0 0 rgba(37,211,102,.55);} 70% { box-shadow:0 0 0 9px rgba(37,211,102,0);} 100% { box-shadow:0 0 0 0 rgba(37,211,102,0);} }

        /* hero */
        .ws-h1 { font-size: clamp(3.1rem, 8.6vw, 8.4rem); line-height:.92; letter-spacing:-.025em; }
        .ws-lede { font-size: clamp(1.05rem, 1.2vw, 1.25rem); line-height:1.6; color: var(--muted); }

        /* browser window */
        .ws-reel { position:relative; }
        .ws-window { position:relative; border-radius:14px; overflow:hidden; background:#161514;
          border:1px solid rgba(255,255,255,.09);
          box-shadow: 0 50px 140px -40px color-mix(in oklab, var(--tint) 55%, transparent), 0 30px 70px -25px rgba(0,0,0,.8);
          transition: box-shadow 1.4s ease; }
        .ws-chrome { display:flex; align-items:center; gap:14px; height:46px; padding:0 14px; background:#1c1b1a; }
        .ws-dots { display:flex; gap:7px; flex:none; }
        .ws-dots i { width:11px; height:11px; border-radius:99px; background:#3a3836; }
        .ws-dots i:nth-child(1){ background:#ec6a5e; } .ws-dots i:nth-child(2){ background:#f4bf4f; } .ws-dots i:nth-child(3){ background:#61c554; }
        .ws-tabs { display:flex; gap:4px; min-width:0; flex:1; align-self:stretch; align-items:flex-end; overflow:hidden; }
        .ws-tab { position:relative; display:flex; align-items:center; gap:8px; min-width:0; height:36px; padding:0 14px;
          border-radius:9px 9px 0 0; color: var(--faint); font-size:12.5px; transition: background-color .3s, color .3s; flex:1 1 0; max-width:210px; }
        .ws-tab:hover { color: var(--muted); background: rgba(255,255,255,.03); }
        .ws-tab[aria-selected="true"] { background:#262524; color: var(--ink); }
        .ws-tab-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ws-tab-bar { position:absolute; left:10px; right:10px; bottom:0; height:2px; border-radius:2px; transform-origin:left;
          background: color-mix(in oklab, var(--tint) 85%, #fff); transition: transform .3s linear; }
        .ws-fav { width:16px; height:16px; border-radius:4px; flex:none; object-fit:contain; }
        .ws-tab:not([aria-selected="true"]) .ws-fav { filter: grayscale(1); opacity:.55; }
        .ws-address { display:flex; align-items:center; gap:12px; height:46px; padding:0 10px 0 14px; background:#262524; border-bottom:1px solid rgba(0,0,0,.4); }
        .ws-url { display:flex; align-items:center; gap:8px; min-width:0; flex:1; height:30px; padding:0 12px; border-radius:8px;
          background:#1a1918; color: var(--muted); font-family: var(--ws-mono), ui-monospace, monospace; font-size:12px; }
        .ws-visit { flex:none; display:inline-flex; align-items:center; gap:6px; height:30px; padding:0 14px; border-radius:8px; font-size:12.5px; font-weight:500;
          background: color-mix(in oklab, var(--tint) 85%, #fff); color:#0c0b0a; transition: background-color 1.4s ease, transform .25s; }
        .ws-visit:hover { transform: translateY(-1px); }
        .ws-soon { flex:none; height:30px; display:inline-flex; align-items:center; padding:0 12px; border-radius:8px; font-size:12px; color: var(--muted); border:1px dashed rgba(255,255,255,.18); }
        .ws-screen-wrap { position:relative; aspect-ratio:16/10; background:#0e0d0c; overflow:hidden; }
        .ws-layer { position:absolute; inset:0; opacity:0; transition: opacity .8s ease; }
        .ws-layer.is-on { opacity:1; }
        .ws-screen { position:absolute; inset:0; overflow:hidden; }
        .ws-drift img { animation: ws-drift 7s ease-out both; }
        @keyframes ws-drift { from { transform: scale(1.0); } to { transform: scale(1.06); } }

        .ws-phone { position:absolute; aspect-ratio: 390/844; border-radius: clamp(18px, 2.6vw, 34px); padding: clamp(4px, .5vw, 7px);
          background:#0a0a0a; box-shadow: 0 0 0 1px rgba(255,255,255,.12), 0 40px 80px -20px rgba(0,0,0,.85), 0 20px 60px -20px color-mix(in oklab, var(--tint) 40%, transparent); }
        .ws-phone-screen { position:relative; width:100%; height:100%; border-radius: clamp(14px, 2.1vw, 28px); overflow:hidden; background:#111; }
        .ws-phone-notch { position:absolute; top: clamp(8px, 1vw, 13px); left:50%; transform:translateX(-50%); width:30%; height: clamp(8px, 1.1vw, 15px); border-radius:99px; background:#0a0a0a; }
        .ws-reel-phone { width: clamp(92px, 17%, 200px); right: clamp(-28px, -2.5%, -8px); bottom: clamp(30px, 6%, 70px); }
        .ws-reel-caption { display:flex; justify-content:space-between; gap:16px; margin-top:18px; font-size:12px; color: var(--faint); letter-spacing:.02em; }

        /* marquee */
        .ws-marquee { display:flex; width:max-content; animation: ws-marquee 45s linear infinite; }
        .ws-marquee:hover { animation-play-state: paused; }
        @keyframes ws-marquee { to { transform: translateX(-50%); } }

        /* work */
        .ws-h2 { font-size: clamp(2.6rem, 5.4vw, 4.8rem); line-height:.98; letter-spacing:-.02em; }
        .ws-project { padding-block: clamp(56px, 7vw, 104px); border-top:1px solid var(--line); }
        .ws-pname { font-size: clamp(2.3rem, 4.2vw, 3.8rem); line-height:1; letter-spacing:-.02em; }
        .ws-media { position:relative; padding-right: clamp(26px, 7%, 64px); padding-bottom: clamp(18px, 4%, 36px); }
        .ws-window-sm { border-radius:12px; }
        .ws-chrome-sm { height:40px; gap:12px; background:#1f1e1d; border-bottom:1px solid rgba(0,0,0,.4); }
        .ws-url-sm { height:26px; font-size:11.5px; max-width:420px; margin-inline:auto; justify-content:center; }
        .ws-chrome-sm::after { content:""; width:47px; flex:none; }
        .ws-media-phone { width: clamp(84px, 21%, 172px); right:0; bottom:0; }
        .ws-swatch { width:22px; height:22px; border-radius:99px; box-shadow: 0 0 0 1px rgba(255,255,255,.14) inset, 0 0 0 2px var(--bg); }
        .ws-swatch + .ws-swatch { margin-left:-6px; }
        .ws-sitebtn { display:inline-flex; align-items:center; gap:10px; height:46px; padding:0 20px; font-size:14px; font-weight:600;
          transition: transform .25s cubic-bezier(.16,1,.3,1), filter .25s; }
        .ws-sitebtn:hover { transform: translateY(-2px); filter: brightness(1.08); }
        .ws-sitebtn img { width:18px; height:18px; border-radius:4px; background:#fff1; }

        /* steps */
        .ws-step { border-top:1px solid var(--line); padding-top:26px; }

        /* contact */
        .ws-paper { background: var(--paper); color: var(--paper-ink); }
        .ws-paper .ws-label { color: var(--paper-muted); }
        .ws-h-xl { font-size: clamp(3.4rem, 10vw, 9.5rem); line-height:.9; letter-spacing:-.03em; }
        .ws-btn-ink { background: var(--paper-ink); color: var(--paper); }
        .ws-btn-ink:hover { background:#000; }
        .ws-copy { height:30px; padding:0 12px; border-radius:99px; font-size:11px; letter-spacing:.1em; text-transform:uppercase; border:1px solid var(--paper-line); color: var(--paper-muted); transition: color .2s, border-color .2s; }
        .ws-copy:hover { color: var(--paper-ink); border-color: var(--paper-ink); }
        .ws-contact-row { border-top:1px solid var(--paper-line); }


        @media (max-width: 767px) {
          .ws-tab { padding:0 10px; justify-content:center; flex:1 1 0; }
          .ws-tab-name { display:none; }
          .ws-chrome { gap:10px; padding:0 10px; }
          .ws-dots i { width:9px; height:9px; } .ws-dots { gap:5px; }
          .ws-address { gap:8px; padding:0 8px 0 10px; height:42px; }
          .ws-url { font-size:11px; padding:0 9px; }
          .ws-visit, .ws-soon { padding:0 10px; font-size:11.5px; }
          .ws-reel-phone { right:-6px; bottom:-18px; width:24%; }
          .ws-chrome-sm::after { display:none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ws-marquee, .ws-dot, .ws-drift img { animation:none; }
        }
      `}</style>

      <TintWatcher />
      <div className="ws-glow" aria-hidden="true" />
      <div className="ws-grid" aria-hidden="true" />

      {/* ───────── Top bar ───────── */}
      <header className="ws-bar">
        <div className="ws-wrap flex h-full items-center justify-between gap-6">
          <a href="#top" className="flex items-baseline gap-3">
            <span className="ws-serif text-[1.45rem] leading-none tracking-tight">Daniel Jenkins</span>
            <span className="ws-label hidden sm:inline">Websites</span>
          </a>
          <nav className="ws-nav flex items-center gap-7 text-[14px]">
            <a href="#work" className="hidden md:inline">Work</a>
            <a href="#how" className="hidden md:inline">How it works</a>
            <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="ws-btn ws-btn-wa ws-btn-sm">
              <WhatsAppIcon size={16} />
              <span>Let&apos;s chat</span>
            </a>
          </nav>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section id="top" data-tint={PROJECTS[0].tint} className="relative z-10 pt-[calc(var(--bar-h)+clamp(56px,9vw,120px))]">
        <div className="ws-wrap">
          <Reveal y={20}>
            <p className="ws-label flex items-center gap-3">
              <span className="ws-dot" aria-hidden="true" />
              Taking on new projects
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="ws-serif ws-h1 mt-7 max-w-[11ch]">
              Websites that feel like <em className="ws-accent">you.</em>
            </h1>
          </Reveal>
          <div className="mt-9 flex flex-col gap-9 md:flex-row md:items-end md:justify-between">
            <Reveal delay={0.16} className="max-w-[34rem]">
              <p className="ws-lede">
                I design and build custom websites for companies, brands and people. Here are a few I&apos;ve made -
                let&apos;s talk about yours.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="flex flex-wrap gap-3">
                <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="ws-btn ws-btn-wa">
                  <WhatsAppIcon />
                  WhatsApp me
                </a>
                <a href={CONTACT.emailHref} className="ws-btn ws-btn-line">
                  <Mail />
                  Email me
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.3} y={48} className="mt-[clamp(56px,7vw,96px)]">
            <Showreel projects={PROJECTS} />
          </Reveal>
        </div>

        {/* Names of the sites, drifting past */}
        <div className="mt-[clamp(72px,9vw,128px)] overflow-hidden border-y border-[var(--line)] py-6" aria-hidden="true">
          <div className="ws-marquee">
            {[0, 1].map((n) => (
              <div key={n} className="flex shrink-0 items-center">
                {[...PROJECTS, ...PROJECTS].map((p, i) => (
                  <span key={`${p.key}-${i}`} className="flex items-center gap-4 pr-14">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.icon} alt="" width={22} height={22} className="h-[22px] w-[22px] rounded-[5px] object-contain" />
                    <span className="ws-serif whitespace-nowrap text-[1.7rem] leading-none text-[var(--ink)]/85">{p.name}</span>
                    <span className="ws-label whitespace-nowrap">{p.kind}</span>
                    <span className="pl-10 text-[var(--faint)]">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Work ───────── */}
      <section id="work" className="relative z-10 pt-[var(--section)]">
        <div className="ws-wrap">
          <Reveal>
            <div className="flex items-end justify-between gap-6 pb-[clamp(40px,5vw,72px)]">
              <div>
                <p className="ws-label">Selected work</p>
                <h2 className="ws-serif ws-h2 mt-5">
                  Sites I&apos;ve <em className="ws-accent">built</em>
                </h2>
              </div>
              <p className="ws-mono hidden pb-2 text-[12px] text-[var(--faint)] sm:block">
                {String(live.length).padStart(2, "0")} live · {String(PROJECTS.length - live.length).padStart(2, "0")} coming soon
              </p>
            </div>
          </Reveal>

          {PROJECTS.map((p, i) => (
            <article key={p.key} data-tint={p.tint} className="ws-project">
              <div className="grid grid-cols-1 items-center gap-x-[clamp(32px,6vw,96px)] gap-y-10 md:grid-cols-12">
                <Reveal className={`min-w-0 md:col-span-5 ${i % 2 ? "md:order-2" : ""}`}>
                  <p className="ws-mono text-[12px] text-[var(--faint)]">
                    {String(i + 1).padStart(2, "0")} <span className="mx-2">/</span> {String(PROJECTS.length).padStart(2, "0")}
                  </p>
                  <h3 className="ws-serif ws-pname mt-5">{p.name}</h3>
                  <p className="ws-label mt-4 !tracking-[.12em]">{p.kind}</p>
                  <p className="mt-6 max-w-[30rem] text-[1.02rem] leading-[1.7] text-[var(--muted)]">{p.blurb}</p>
                  <div className="mt-7 flex items-center gap-4">
                    <span className="flex" aria-hidden="true">
                      {p.palette.map((c) => (
                        <span key={c} className="ws-swatch" style={{ background: c }} />
                      ))}
                    </span>
                    <span className="ws-mono text-[11px] uppercase tracking-[.14em] text-[var(--faint)]">Its colours</span>
                  </div>
                  <div className="mt-9">
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ws-sitebtn"
                        style={{
                          background: p.button.bg,
                          color: p.button.fg,
                          borderRadius: p.button.radius,
                          textTransform: p.button.upper ? "uppercase" : undefined,
                          letterSpacing: p.button.upper ? ".12em" : undefined,
                          fontSize: p.button.upper ? "12.5px" : undefined,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.icon} alt="" width={18} height={18} />
                        Visit website
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <span className="ws-mono inline-flex h-[46px] items-center gap-3 rounded-full border border-dashed border-[var(--line)] px-5 text-[12px] uppercase tracking-[.14em] text-[var(--muted)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--tint)]" />
                        Launching soon
                      </span>
                    )}
                  </div>
                </Reveal>
                <Reveal delay={0.1} y={48} className={`min-w-0 md:col-span-7 ${i % 2 ? "md:order-1" : ""}`}>
                  <ProjectMedia p={p} />
                </Reveal>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section id="how" data-tint="#cfc8bb" className="relative z-10 py-[var(--section)]">
        <div className="ws-wrap">
          <Reveal>
            <p className="ws-label">How it works</p>
            <h2 className="ws-serif ws-h2 mt-5 max-w-[14ch]">
              Simple, personal, <em className="ws-accent">made for you.</em>
            </h2>
          </Reveal>
          <div className="mt-[clamp(48px,6vw,88px)] grid gap-x-[clamp(24px,4vw,64px)] gap-y-12 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08} className="ws-step">
                <p className="ws-mono text-[12px] text-[var(--faint)]">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="ws-serif mt-6 text-[2.1rem] leading-none">{s.title}</h3>
                <p className="mt-4 max-w-[24rem] leading-[1.7] text-[var(--muted)]">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Contact ───────── */}
      <section id="contact" className="ws-paper relative z-10 py-[var(--section)]">
        <div className="ws-wrap">
          <Reveal>
            <p className="ws-label">Let&apos;s talk</p>
            <h2 className="ws-serif ws-h-xl mt-6">
              Let&apos;s build <em>yours.</em>
            </h2>
          </Reveal>
          <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-12 md:grid-cols-12 md:items-end">
            <Reveal className="md:col-span-5">
              <p className="max-w-[28rem] text-[1.1rem] leading-[1.65] text-[var(--paper-muted)]">
                Every website is different, so pricing is a private conversation. Send me a message - tell me what you have
                in mind and we&apos;ll take it from there.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="md:col-span-7">
              <div className="ws-contact-row flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="ws-label">WhatsApp</p>
                  <p className="ws-serif mt-2 text-[1.9rem] leading-none">{CONTACT.whatsapp}</p>
                </div>
                <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="ws-btn ws-btn-wa self-start sm:self-auto">
                  <WhatsAppIcon />
                  Chat on WhatsApp
                </a>
              </div>
              <div className="ws-contact-row flex flex-col gap-5 border-b border-[var(--paper-line)] py-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="ws-label">Email</p>
                  <p className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="ws-serif break-all text-[1.9rem] leading-none">{CONTACT.email}</span>
                    <CopyEmail email={CONTACT.email} />
                  </p>
                </div>
                <a href={CONTACT.emailHref} className="ws-btn ws-btn-ink self-start sm:self-auto">
                  <Mail />
                  Send an email
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <footer className="ws-paper relative z-10 border-t border-[var(--paper-line)]">
        <div className="ws-wrap ws-mono flex flex-col gap-2 py-8 text-[11px] uppercase tracking-[.14em] text-[var(--paper-muted)] sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Daniel Jenkins</span>
          <span>Websites for companies, brands &amp; people</span>
        </div>
      </footer>
    </main>
  );
}
