// Small inline icon set (1.6px strokes on a 24px grid). Decorative by default.

const paths = {
  "arrow-right": <path d="M5 12h14m-6-6 6 6-6 6" />,
  "arrow-up-right": <path d="M7 17 17 7M8 7h9v9" />,
  play: <path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor" stroke="none" />,
  pause: (
    <g fill="currentColor" stroke="none">
      <rect x="6.5" y="5" width="3.6" height="14" rx="1" />
      <rect x="13.9" y="5" width="3.6" height="14" rx="1" />
    </g>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 8h16M4 16h16" />,
  info: (
    <g>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.6v.4" />
    </g>
  ),
  alert: (
    <g>
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path d="M12 10v4.5M12 17v.4" />
    </g>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  lock: (
    <g>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </g>
  ),
  layers: <path d="m12 4 9 5-9 5-9-5 9-5Zm-9 9.5 9 5 9-5" />,
  briefcase: (
    <g>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 13h17" />
    </g>
  ),
  people: (
    <g>
      <circle cx="9" cy="9" r="3.2" />
      <path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5" />
      <circle cx="17" cy="8.5" r="2.5" />
      <path d="M16 14.2c2.2-.2 3.9 1.1 4.5 3.8" />
    </g>
  ),
  document: (
    <g>
      <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5A.5.5 0 0 1 6.5 20V4a.5.5 0 0 1 .5-.5Z" />
      <path d="M13.5 3.5V8h4.5M9.5 12.5h5M9.5 16h5" />
    </g>
  ),
  globe: (
    <g>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5s1.2-6.2 3.6-8.5Z" />
    </g>
  ),
  chart: <path d="M4 20V10m6 10V4m6 16v-7m4 7H3" />,
  wallet: (
    <g>
      <path d="M4 7.5h14.5a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5v-11Zm0 0 11-3v3" />
      <circle cx="16" cy="14" r="1" fill="currentColor" />
    </g>
  ),
  compass: (
    <g>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </g>
  ),
  spark: <path d="M12 3v5m0 8v5m9-9h-5M8 12H3m14.4-6.4-3.5 3.5m-3.8 3.8-3.5 3.5m10.8 0-3.5-3.5M9.1 9.1 5.6 5.6" />,
  shield: (
    <g>
      <path d="M12 3.5 19 6v5.5c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6l7-2.5Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </g>
  ),
  mic: (
    <g>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
    </g>
  ),
  calendar: (
    <g>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </g>
  ),
  inbox: (
    <g>
      <path d="M4 13.5 6.5 5h11l2.5 8.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5.5Z" />
      <path d="M4 13.5h4.5l1 2h5l1-2H20" />
    </g>
  ),
  settings: (
    <g>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5m14.5-6-1.6 1.6M7.6 16.4 6 18m12 0-1.6-1.6M7.6 7.6 6 6" />
    </g>
  ),
  home: <path d="M4 11 12 4.5l8 6.5v8.5a.5.5 0 0 1-.5.5H15v-6H9v6H4.5a.5.5 0 0 1-.5-.5V11Z" />,
  upload: <path d="M12 16V5m-4.5 4.5L12 5l4.5 4.5M5 15v4h14v-4" />,
  download: <path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 15v4h14v-4" />,
  message: <path d="M4.5 5.5h15v10h-8l-4.5 4v-4h-2.5v-10Z" />,
  heart: <path d="M12 19.5s-7.5-4.4-7.5-10A4 4 0 0 1 12 7.2a4 4 0 0 1 7.5 2.3c0 5.6-7.5 10-7.5 10Z" />,
  search: (
    <g>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </g>
  ),
  eye: (
    <g>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </g>
  ),
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className, title }: { name: IconName; className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  );
}
