// Cross-site request check for state-changing public endpoints. Browsers send
// Origin on POST; a request without it must at least be same-origin by
// Sec-Fetch-Site. Anything else is rejected.

export function isAllowedOrigin(headers: Headers, allowedOrigins: string[]): boolean {
  const origin = headers.get("origin");
  if (origin) return allowedOrigins.includes(origin);
  return headers.get("sec-fetch-site") === "same-origin";
}
