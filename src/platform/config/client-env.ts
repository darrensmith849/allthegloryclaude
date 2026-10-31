// Browser-side configuration without a validation library, so public pages
// do not ship Zod. NEXT_PUBLIC_* values are inlined at build time and must be
// referenced literally.

/**
 * Where the platform is mounted. It lives at /agency on alltheglory.co.za;
 * on an independent domain this becomes "" and the app folder moves to the root.
 */
export const routeBase = "/agency";

export const turnstileSiteKey = process.env.NEXT_PUBLIC_AGENCY_TURNSTILE_SITE_KEY || undefined;

/**
 * Whether the public forms accept submissions. Defaults to open in
 * development and closed in production builds until the owner opens them.
 */
export const submissionsOpen =
  (process.env.NEXT_PUBLIC_AGENCY_SUBMISSIONS ?? (process.env.NODE_ENV === "production" ? "closed" : "open")) === "open";

/** Prefix a platform path ("/roster", "/api/enquiries") with the mount point. */
export function withRoute(path: string): string {
  return path === "/" ? routeBase || "/" : `${routeBase}${path}`;
}

/** Strip the mount point from a pathname ("/agency/roster" → "/roster"). */
export function platformPath(pathname: string): string {
  return pathname.startsWith(routeBase) ? pathname.slice(routeBase.length) || "/" : pathname;
}
