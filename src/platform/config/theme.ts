// Theme tokens that a tenant (artist workspace, partner workspace) may
// override. Defaults live in src/styles/tokens.css; a tenant theme is applied
// as CSS custom properties on its workspace root, so no artist ever needs a
// forked codebase (CLAUDE.md quality bar).

export interface TenantTheme {
  /** Primary accent used for active states, links and key figures. */
  accent: string;
  /** Lighter accent for highlighted words and headline figures. */
  accent2: string;
  /** Text colour that reads on the accent. */
  accentInk: string;
  /** Soft tint of the accent for backgrounds. */
  accentSoft: string;
  /** Workspace canvas. */
  canvas: string;
}

export const defaultTheme: TenantTheme = {
  accent: "#d8b25a",
  accent2: "#f1d7a6",
  accentInk: "#0c141a",
  accentSoft: "rgb(216 178 90 / 0.14)",
  canvas: "#0c141a",
};

export function themeToStyle(theme: Partial<TenantTheme>): Record<string, string> {
  const merged = { ...defaultTheme, ...theme };
  return {
    "--accent": merged.accent,
    "--accent-2": merged.accent2,
    "--accent-ink": merged.accentInk,
    "--accent-soft": merged.accentSoft,
    "--canvas": merged.canvas,
  };
}
