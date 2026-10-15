import { CONTACT, PROJECTS } from "./projects";
import { Clock, CopyEmail, Reveal, Rise } from "./motion";

// /websites - Daniel's page for selling the websites he builds. A
// standalone share link on the All The Glory domain (the album site's nav,
// footer, socials and player are hidden here - see components/site/*).
//
// Its own look, drawn from studio sites Daniel picked: deep ink with slow
// aurora colour, big light type mixed with an italic serif, mono labels,
// a live local clock, a spinning "let's talk" badge, a two-circle diagram
// and huge closing words on cream. The sites he has built are plain links
// with their favicons; each row floods with that site's own brand colour
// when you point at it. No screenshots, no previews, no prices.

const INCLUDED = [
  "Designed from scratch, around you",
  "Looks right on every phone",
  "Set up on your own web address",
  "WhatsApp and enquiry buttons built in",
  "Ready to be found on Google",
  "A message away after launch",
];

const STEPS = [
  { title: "Say hello", body: "Message me on WhatsApp or email. Tell me about you, your business and what you'd love your website to do." },
  { title: "Design & build", body: "I design it around you and build it from scratch. You see it come together, and we shape it until it feels right." },
  { title: "Go live", body: "We launch it on your own web address - fast, sharp, and ready for people to find." },
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

// A round badge with words running around it, slowly turning.
function TalkBadge() {
  return (
    <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="ws-badge" aria-label="Let's talk on WhatsApp">
      <svg viewBox="0 0 120 120" className="ws-badge-ring" aria-hidden="true">
        <defs>
          <path id="ws-ring" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" />
        </defs>
        <text>
          <textPath href="#ws-ring" textLength="292" lengthAdjust="spacing">
            LET&apos;S TALK ✳ WHATSAPP ME ✳ LET&apos;S TALK ✳ WHATSAPP ME ✳
          </textPath>
        </text>
      </svg>
      <span className="ws-badge-core">
        <WhatsAppIcon size={22} />
      </span>
    </a>
  );
}

// Two circles - what it looks like, and how well it works - meeting at you.
function Venn() {
  return (
    <svg viewBox="0 0 600 420" className="ws-venn" role="img" aria-label="Design and build, meeting at you">
      <circle className="ws-venn-l" cx="235" cy="210" r="160" />
      <circle className="ws-venn-r" cx="365" cy="210" r="160" />
      <text x="128" y="214" textAnchor="middle">DESIGN</text>
      <text x="472" y="214" textAnchor="middle">BUILD</text>
      <circle className="ws-venn-dot" cx="300" cy="210" r="9" />
      <text x="300" y="250" textAnchor="middle" className="ws-venn-you">
        YOU
      </text>
    </svg>
  );
}

export default function WebsitesPage() {
  const live = PROJECTS.filter((p) => p.url).length;
  return (
    <main className="ws relative min-h-screen overflow-x-clip">
      <style>{`
        .ws {
          --bg:#07091a; --ink:#eef0ff; --muted:rgba(238,240,255,.62); --faint:rgba(238,240,255,.36); --line:rgba(238,240,255,.12);
          --mint:#9ff0d4; --blue:#4256ff; --violet:#8f5cff; --wa:#25d366;
          --cream:#f2ede4; --cink:#0b0c16; --cmuted:rgba(11,12,22,.62); --cline:rgba(11,12,22,.14);
          --pad: clamp(20px, 4.5vw, 72px);
          --max: 1400px;
          --section: clamp(100px, 12vw, 190px);
          background: var(--bg); color: var(--ink);
          font-family: var(--ws-sans), system-ui, sans-serif;
          font-size: clamp(15px, .45vw + 13px, 17px);
          -webkit-font-smoothing: antialiased;
        }
        .ws ::selection { background: var(--mint); color: var(--bg); }
        .ws-wrap { width:100%; max-width: calc(var(--max) + var(--pad) * 2); margin-inline:auto; padding-inline: var(--pad); }
        .ws-it { font-family: var(--ws-serif), Georgia, serif; font-style: italic; font-weight:400; letter-spacing:-.02em; }
        .ws-mono, .ws-label { font-family: var(--ws-mono), ui-monospace, monospace; }
        .ws-label { font-size:11px; letter-spacing:.14em; text-transform:uppercase; color: var(--faint); }

        /* floating menu bar */
        .ws-nav { position:fixed; z-index:50; top:14px; left:50%; transform:translateX(-50%); width:min(calc(100% - 24px), 1180px); height:58px;
          display:flex; align-items:center; justify-content:space-between; gap:16px; padding:0 8px 0 10px; border-radius:999px;
          background: rgba(10,12,32,.82); border:1px solid rgba(238,240,255,.1);
          backdrop-filter: blur(18px) saturate(150%); -webkit-backdrop-filter: blur(18px) saturate(150%); }
        .ws-logo { display:flex; align-items:center; gap:11px; font-size:15px; font-weight:500; letter-spacing:-.01em; }
        .ws-logo-mark { display:grid; place-items:center; width:38px; height:38px; border-radius:99px; color:#fff; font-size:19px;
          background: conic-gradient(from 210deg, var(--blue), var(--violet), var(--mint), var(--blue)); }
        .ws-logo-mark span { margin-top:-2px; }
        .ws-navlinks a { font-family: var(--ws-mono), monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color: var(--muted); transition: color .2s; }
        .ws-navlinks a:hover { color: var(--ink); }
        .ws-cta { display:inline-flex; align-items:center; gap:9px; height:42px; padding:0 18px; border-radius:99px; background: var(--mint); color: var(--bg);
          font-size:14px; font-weight:500; transition: transform .25s cubic-bezier(.16,1,.3,1), background-color .25s; }
        .ws-cta:hover { transform: translateY(-1px); background:#c4f7e6; }

        /* hero */
        .ws-hero { position:relative; min-height: 100svh; display:flex; flex-direction:column; overflow:hidden; isolation:isolate; }
        .ws-hero::after { content:""; position:absolute; inset:auto 0 0 0; height:30%; background: linear-gradient(to bottom, transparent, var(--bg)); z-index:-1; }
        .ws-aurora { position:absolute; inset:0; z-index:-2; pointer-events:none; }
        .ws-aurora i { position:absolute; border-radius:50%; will-change: transform; }
        .ws-aurora i:nth-child(1) { width:80vmax; height:80vmax; left:-30vmax; top:-38vmax; background: radial-gradient(closest-side, rgba(66,86,255,.62), transparent); animation: ws-a 24s ease-in-out infinite alternate; }
        .ws-aurora i:nth-child(2) { width:65vmax; height:65vmax; right:-28vmax; top:-18vmax; background: radial-gradient(closest-side, rgba(143,92,255,.5), transparent); animation: ws-b 30s ease-in-out infinite alternate; }
        .ws-aurora i:nth-child(3) { width:55vmax; height:55vmax; left:18vw; bottom:-38vmax; background: radial-gradient(closest-side, rgba(159,240,212,.32), transparent); animation: ws-c 27s ease-in-out infinite alternate; }
        .ws-aurora i:nth-child(4) { width:34vmax; height:34vmax; left:46vw; top:12vh; background: radial-gradient(closest-side, rgba(90,110,255,.38), transparent); animation: ws-d 19s ease-in-out infinite alternate; }
        @keyframes ws-a { to { transform: translate(22vw, 16vh) scale(1.12); } }
        @keyframes ws-b { to { transform: translate(-18vw, 22vh) scale(.9); } }
        @keyframes ws-c { to { transform: translate(-14vw, -18vh) scale(1.2); } }
        @keyframes ws-d { to { transform: translate(-26vw, 20vh) scale(1.3); } }
        .ws-grain { position:absolute; inset:0; z-index:-1; pointer-events:none; opacity:.16; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .ws-h1 { font-weight:300; font-size: clamp(2.6rem, min(9.6vw, 15vh), 11rem); line-height:.9; letter-spacing:-.05em; }
        .ws-h1 .ws-it { font-size:1.06em; letter-spacing:-.035em; }
        @media (max-width: 639px) { .ws-h1 { font-size: 12.2vw; } }
        .ws-intro { max-width:27rem; font-size: clamp(1.02rem, 1.1vw, 1.15rem); line-height:1.6; color: var(--muted); }
        .ws-btn { display:inline-flex; align-items:center; justify-content:center; gap:10px; height:54px; padding:0 24px; border-radius:99px; font-size:15px; font-weight:500; white-space:nowrap;
          transition: transform .25s cubic-bezier(.16,1,.3,1), background-color .25s, border-color .25s, color .25s; }
        .ws-btn:hover { transform: translateY(-2px); }
        .ws-btn-ink { background: var(--ink); color: var(--bg); }
        .ws-btn-ink:hover { background:#fff; }
        .ws-btn-ink svg { color: #16a34a; }
        .ws-btn-ghost { border:1px solid rgba(238,240,255,.28); color: var(--ink); }
        .ws-btn-ghost:hover { border-color: var(--ink); background: rgba(238,240,255,.06); }
        .ws-corners { display:flex; justify-content:space-between; align-items:center; gap:16px; padding-block: 22px; border-top:1px solid var(--line); }
        .ws-dot { width:7px; height:7px; border-radius:99px; background: var(--mint); box-shadow: 0 0 0 0 rgba(159,240,212,.6); animation: ws-ping 2.4s infinite; }
        @keyframes ws-ping { 70% { box-shadow: 0 0 0 9px rgba(159,240,212,0); } 100% { box-shadow: 0 0 0 0 rgba(159,240,212,0); } }

        .ws-badge { position:relative; display:grid; place-items:center; width: clamp(104px, 9vw, 138px); aspect-ratio:1; flex:none; color: var(--ink); }
        .ws-badge-ring { position:absolute; inset:0; width:100%; height:100%; animation: ws-spin 18s linear infinite; }
        .ws-badge-ring text { font-family: var(--ws-mono), monospace; font-size:10.5px; letter-spacing:.06em; fill: currentColor; }
        .ws-badge-core { display:grid; place-items:center; width:46%; aspect-ratio:1; border-radius:99px; background: var(--mint); color: var(--bg);
          transition: transform .4s cubic-bezier(.16,1,.3,1); }
        .ws-badge:hover .ws-badge-core { transform: scale(1.12) rotate(-12deg); }
        @keyframes ws-spin { to { transform: rotate(360deg); } }

        /* statement */
        .ws-caps { font-family: var(--ws-serif), Georgia, serif; text-transform:uppercase; font-weight:400; letter-spacing:.01em;
          font-size: clamp(2.1rem, 5.4vw, 5.2rem); line-height:1.04; text-align:center; }
        .ws-caps em { display:block; font-style:normal; color: var(--mint); }

        /* work */
        .ws-h2 { font-weight:300; font-size: clamp(2.8rem, 7vw, 7rem); line-height:.92; letter-spacing:-.05em; }
        .ws-list { border-bottom:1px solid var(--line); }
        .ws-row { position:relative; display:block; isolation:isolate; border-top:1px solid var(--line); color: var(--ink); transition: color .45s cubic-bezier(.7,0,.2,1); }
        .ws-row::before { content:""; position:absolute; inset:0; z-index:-1; background: var(--c); transform: scaleY(0); transform-origin: 50% 100%;
          transition: transform .55s cubic-bezier(.7,0,.2,1); }
        a.ws-row:hover, a.ws-row:focus-visible { color: var(--ci); outline:none; }
        a.ws-row:hover::before, a.ws-row:focus-visible::before { transform: scaleY(1); }
        .ws-row-in { display:grid; align-items:center; grid-template-columns: 48px minmax(0,1fr) 40px; column-gap: 14px; row-gap: 10px; padding-block: 22px; }
        .ws-num { font-family: var(--ws-mono), monospace; font-size:12px; opacity:.5; }
        .ws-tile { grid-row: span 1; display:grid; place-items:center; width:48px; height:48px; border-radius:14px; background: rgba(238,240,255,.07);
          border:1px solid rgba(238,240,255,.1); transition: background-color .45s, transform .45s cubic-bezier(.16,1,.3,1); }
        .ws-tile img { width:26px; height:26px; border-radius:6px; object-fit:contain; }
        a.ws-row:hover .ws-tile { background: rgba(255,255,255,.92); transform: rotate(-8deg) scale(1.06); }
        .ws-rname { font-weight:300; font-size: clamp(1.75rem, 5.2vw, 5.2rem); line-height:1.12; padding-bottom:.04em; letter-spacing:-.045em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
          transition: transform .55s cubic-bezier(.16,1,.3,1); }
        a.ws-row:hover .ws-rname { transform: translateX(14px); }
        .ws-tags { display:flex; flex-wrap:wrap; gap:6px; }
        .ws-tag { font-family: var(--ws-mono), monospace; font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; height:26px; display:inline-flex; align-items:center;
          padding:0 10px; border-radius:99px; border:1px solid currentColor; opacity:.55; }
        .ws-go { display:grid; place-items:center; width:40px; height:40px; border-radius:99px; border:1px solid currentColor; font-size:16px; opacity:.7;
          transition: transform .45s cubic-bezier(.16,1,.3,1), opacity .3s; justify-self:end; }
        a.ws-row:hover .ws-go { transform: rotate(45deg); opacity:1; }
        .ws-soon { font-family: var(--ws-mono), monospace; font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color: var(--mint); white-space:nowrap; }
        .ws-row .ws-num { grid-column: 1 / -1; grid-row: 1; }
        .ws-row .ws-tile { grid-column: 1; grid-row: 2; }
        .ws-row .ws-rname { grid-column: 2; grid-row: 2; white-space: normal; font-size: clamp(1.75rem, 7.6vw, 2.8rem); }
        .ws-row .ws-go, .ws-row .ws-soon { grid-column: 3; grid-row: 2; }
        .ws-row .ws-tags { grid-column: 2 / -1; grid-row: 3; }
        @media (min-width: 900px) {
          .ws-row .ws-num, .ws-row .ws-tile, .ws-row .ws-rname, .ws-row .ws-go, .ws-row .ws-soon, .ws-row .ws-tags { grid-row: auto; grid-column: auto; }
          .ws-row .ws-rname { white-space: nowrap; font-size: clamp(1.75rem, 5.2vw, 5.2rem); }
          .ws-row-in { grid-template-columns: 56px 64px minmax(0,1fr) auto 56px; column-gap: clamp(16px, 2vw, 32px); padding-block: clamp(24px, 2.6vw, 38px); }
          .ws-row .ws-tags { justify-content:flex-end; }
          .ws-tile { width:64px; height:64px; border-radius:18px; }
          .ws-tile img { width:32px; height:32px; }
          .ws-go { width:56px; height:56px; font-size:20px; }
        }

        /* what you get */
        .ws-venn { width:100%; height:auto; overflow:visible; }
        .ws-venn circle { fill:none; stroke: rgba(238,240,255,.42); stroke-width:1.2; }
        .ws-venn-l { animation: ws-l 7s ease-in-out infinite alternate; }
        .ws-venn-r { animation: ws-r 7s ease-in-out infinite alternate; }
        @keyframes ws-l { to { transform: translateX(-14px); } }
        @keyframes ws-r { to { transform: translateX(14px); } }
        .ws-venn .ws-venn-dot { fill: var(--mint); stroke:none; filter: drop-shadow(0 0 14px rgba(159,240,212,.8)); }
        .ws-venn text { font-family: var(--ws-mono), monospace; font-size:12px; letter-spacing:.24em; fill: var(--muted); }
        .ws-venn .ws-venn-you { fill: var(--mint); }
        .ws-inc li { display:grid; grid-template-columns: 44px minmax(0,1fr); padding-block:16px; border-top:1px solid var(--line); font-size: clamp(1.05rem, 1.3vw, 1.3rem); font-weight:300; }
        .ws-inc li span { font-family: var(--ws-mono), monospace; font-size:11px; color: var(--mint); padding-top:.45em; }

        /* process */
        .ws-steps { display:grid; grid-template-columns: minmax(0,1fr); border-top:1px solid var(--line); }
        .ws-step { padding: 28px 0 8px; border-bottom:1px solid var(--line); }
        @media (min-width: 768px) {
          .ws-steps { grid-template-columns: repeat(3, minmax(0,1fr)); border-bottom:1px solid var(--line); }
          .ws-step { padding: 32px clamp(16px, 2.4vw, 36px) 40px; border-bottom:0; border-left:1px solid var(--line); }
          .ws-step:first-child { border-left:0; padding-left:0; }
        }

        /* contact */
        .ws-cream { background: var(--cream); color: var(--cink); }
        .ws-cream .ws-label { color: var(--cmuted); }
        .ws-giant { font-weight:700; text-transform:uppercase; font-size: clamp(4.4rem, 17vw, 18rem); line-height:.8; letter-spacing:-.065em; }
        .ws-giant .ws-it { text-transform:none; font-weight:400; letter-spacing:-.04em; font-size:1.08em; }
        .ws-card { display:flex; flex-direction:column; justify-content:space-between; gap:28px; min-height:240px; padding: clamp(22px, 2.6vw, 36px); border-radius:24px; }
        .ws-card-dark { background: var(--cink); color: var(--cream); }
        .ws-card-line { border:1px solid rgba(11,12,22,.2); }
        .ws-card .ws-big { font-weight:300; font-size: clamp(1.7rem, 2.8vw, 2.7rem); letter-spacing:-.035em; line-height:1.05; }
        .ws-btn-wa { background: var(--wa); color:#052e14; }
        .ws-btn-wa:hover { background:#3ae07a; }
        .ws-btn-dark { background: var(--cink); color: var(--cream); }
        .ws-btn-dark:hover { background:#000; }
        .ws-copy { height:32px; padding:0 14px; border-radius:99px; font-size:11px; letter-spacing:.1em; text-transform:uppercase; border:1px solid rgba(11,12,22,.25);
          color: var(--cmuted); transition: color .2s, border-color .2s; }
        .ws-copy:hover { color: var(--cink); border-color: var(--cink); }
        .ws-foot { display:flex; flex-wrap:wrap; justify-content:space-between; gap:12px; padding-block:26px; border-top:1px solid var(--cline);
          font-family: var(--ws-mono), monospace; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color: var(--cmuted); }

        @media (prefers-reduced-motion: reduce) {
          .ws-aurora i, .ws-badge-ring, .ws-venn-l, .ws-venn-r, .ws-dot { animation:none; }
        }
      `}</style>

      {/* ───────── Floating menu ───────── */}
      <header className="ws-nav">
        <a href="#top" className="ws-logo" aria-label="Daniel Jenkins - websites, back to top">
          <span className="ws-logo-mark ws-it">
            <span>dj</span>
          </span>
          <span className="hidden sm:inline">Daniel Jenkins</span>
        </a>
        <nav className="ws-navlinks hidden items-center gap-8 md:flex">
          <a href="#work">Work</a>
          <a href="#how">Process</a>
          <a href="#contact">Contact</a>
        </nav>
        <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="ws-cta">
          <WhatsAppIcon size={16} />
          Let&apos;s talk
        </a>
      </header>

      {/* ───────── Hero ───────── */}
      <section id="top" className="ws-hero">
        <div className="ws-aurora" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="ws-grain" aria-hidden="true" />

        <div className="ws-wrap flex flex-1 flex-col justify-center pb-10 pt-[clamp(110px,15vh,180px)]">
          <h1 className="ws-h1">
            <Rise>
              <span className="ws-it">Websites</span>
            </Rise>
            <Rise delay={0.12} className="pl-[5vw] md:pl-[10vw]">
              for companies
            </Rise>
            <Rise delay={0.24} className="pl-[2vw] md:pl-[3vw]">
              &amp; <span className="ws-it">people.</span>
            </Rise>
          </h1>
          <div className="mt-[clamp(32px,4.5vw,64px)] flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <Reveal delay={0.4}>
              <p className="ws-intro">
                Hi, I&apos;m Daniel. I design and build custom websites from scratch - made to fit you, and set up on your
                own web address.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="ws-btn ws-btn-ink">
                  <WhatsAppIcon />
                  WhatsApp me
                </a>
                <a href={CONTACT.emailHref} className="ws-btn ws-btn-ghost">
                  <Mail />
                  Email me
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.55} className="self-end md:self-auto">
              <TalkBadge />
            </Reveal>
          </div>
        </div>

        <div className="ws-wrap">
          <div className="ws-corners ws-label">
            <span className="flex items-center gap-3">
              <span className="ws-dot" aria-hidden="true" />
              Taking on new projects
            </span>
            <a href="#work" className="hidden transition-colors hover:text-[var(--ink)] sm:inline">
              Scroll ↓
            </a>
            <span>
              Local time <Clock /> GMT+2
            </span>
          </div>
        </div>
      </section>

      {/* ───────── Statement ───────── */}
      <section className="py-[var(--section)]">
        <div className="ws-wrap">
          <Reveal>
            <p className="ws-label text-center">( A thought )</p>
            <h2 className="ws-caps mx-auto mt-8 max-w-[18ch]">
              Your website is your first handshake. <em>Let&apos;s make it a good one.</em>
            </h2>
          </Reveal>
        </div>
      </section>

      {/* ───────── Work ───────── */}
      <section id="work" className="pb-[var(--section)]">
        <div className="ws-wrap">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6 pb-[clamp(36px,4vw,64px)]">
              <div>
                <p className="ws-label">( Selected work · {String(PROJECTS.length).padStart(2, "0")} )</p>
                <h2 className="ws-h2 mt-6">
                  Sites I&apos;ve <span className="ws-it">built</span>
                </h2>
              </div>
              <p className="ws-label max-w-[16rem] leading-relaxed md:text-right">
                {live} live, {PROJECTS.length - live} on the way. Tap a site to visit it ↗
              </p>
            </div>
          </Reveal>
        </div>
        <ul className="ws-list">
          {PROJECTS.map((p, i) => {
            const inner = (
              <div className="ws-wrap ws-row-in">
                <span className="ws-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="ws-tile">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.icon} alt="" width={32} height={32} />
                </span>
                <span className="ws-rname">{p.name}</span>
                <span className="ws-tags">
                  {p.tags.map((t) => (
                    <span key={t} className="ws-tag">
                      {t}
                    </span>
                  ))}
                </span>
                {p.url ? (
                  <span className="ws-go" aria-hidden="true">
                    ↗
                  </span>
                ) : (
                  <span className="ws-soon justify-self-end">Soon</span>
                )}
              </div>
            );
            const style = { "--c": p.color, "--ci": p.ink } as React.CSSProperties;
            return (
              <li key={p.key}>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="ws-row" style={style} aria-label={`${p.name} - visit the site (opens in a new tab)`}>
                    {inner}
                  </a>
                ) : (
                  <div className="ws-row" style={style} aria-label={`${p.name} - launching soon`}>
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ───────── What you get ───────── */}
      <section className="pb-[var(--section)]">
        <div className="ws-wrap grid grid-cols-1 items-center gap-x-[clamp(32px,6vw,120px)] gap-y-14 md:grid-cols-2">
          <Reveal>
            <Venn />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="ws-label">( What you get )</p>
            <h2 className="ws-h2 mt-6 !text-[clamp(2.4rem,4.6vw,4.6rem)]">
              Looks right. <span className="ws-it">Works</span> right.
            </h2>
            <ul className="ws-inc mt-10">
              {INCLUDED.map((t, i) => (
                <li key={t}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ───────── Process ───────── */}
      <section id="how" className="pb-[var(--section)]">
        <div className="ws-wrap">
          <Reveal>
            <p className="ws-label">( How it works )</p>
            <h2 className="ws-h2 mt-6">
              Three steps. <span className="ws-it">No fuss.</span>
            </h2>
          </Reveal>
          <div className="ws-steps mt-[clamp(44px,5vw,80px)]">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08} className="ws-step">
                <p className="ws-label">Step {String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-6 text-[clamp(1.8rem,2.6vw,2.4rem)] font-light leading-none tracking-[-.035em]">{s.title}</h3>
                <p className="mt-4 max-w-[24rem] leading-[1.65] text-[var(--muted)]">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Contact ───────── */}
      <section id="contact" className="ws-cream pt-[clamp(72px,9vw,140px)]">
        <div className="ws-wrap">
          <div className="ws-label flex flex-wrap justify-between gap-4">
            <span>( Start a project )</span>
            <span>Pricing is a private conversation</span>
          </div>
          <h2 className="ws-giant mt-[clamp(32px,5vw,72px)]">
            <Rise>Let&apos;s</Rise>
            <Rise delay={0.1} className="text-right">
              <span className="ws-it">build</span>
            </Rise>
            <Rise delay={0.2} className="pl-[12vw]">
              yours.
            </Rise>
          </h2>
          <Reveal className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-4 md:grid-cols-12">
            <p className="max-w-[26rem] text-[1.12rem] leading-[1.6] text-[var(--cmuted)] md:col-span-4">
              Every website is different, so I don&apos;t list prices here. Send me a message - tell me about you and what you
              need, and we&apos;ll take it from there.
            </p>
            <div className="ws-card ws-card-dark md:col-span-4">
              <div>
                <p className="ws-label !text-[rgba(242,237,228,.55)]">WhatsApp</p>
                <p className="ws-big mt-4">{CONTACT.whatsapp}</p>
              </div>
              <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="ws-btn ws-btn-wa self-start">
                <WhatsAppIcon />
                Chat on WhatsApp
              </a>
            </div>
            <div className="ws-card ws-card-line md:col-span-4">
              <div className="min-w-0">
                <p className="ws-label">Email</p>
                <p className="ws-big mt-4">
                  {CONTACT.email.split("@")[0]}@
                  <wbr />
                  {CONTACT.email.split("@")[1]}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a href={CONTACT.emailHref} className="ws-btn ws-btn-dark">
                  <Mail />
                  Send an email
                </a>
                <CopyEmail email={CONTACT.email} />
              </div>
            </div>
          </Reveal>
        </div>
        <div className="ws-wrap mt-[clamp(72px,9vw,140px)]">
          <footer className="ws-foot">
            <span>© {new Date().getFullYear()} Daniel Jenkins</span>
            <span>
              Local time <Clock /> GMT+2
            </span>
            <a href="#top" className="transition-colors hover:text-[var(--cink)]">
              Back to top ↑
            </a>
          </footer>
        </div>
      </section>
    </main>
  );
}
