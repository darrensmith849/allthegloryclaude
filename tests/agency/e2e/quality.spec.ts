import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { demoRoutes, publicRoutes, widths } from "./routes";

// Every route: loads, no console errors, no horizontal overflow at the four
// required widths, and no serious or critical axe violations.

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    // All the Glory's own page-view tracker needs Cloudflare bindings that a
    // local `next start` does not have; it is not part of the platform.
    if (msg.type() === "error" && !msg.location().url.includes("/api/track")) errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

async function overflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

for (const route of [...publicRoutes, ...demoRoutes]) {
  test(`quality ${route}`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const response = await page.goto(route);
    expect(response?.status(), "HTTP status").toBe(200);

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(50);
      expect(await overflow(page), `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);
    }

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`), `axe at ${width}px`).toEqual([]);
    }

    expect(errors, "console errors").toEqual([]);
  });
}

test("demonstrations and sample profiles are noindex", async ({ page }) => {
  for (const route of ["/agency/demo", "/agency/roster/msasa-room", "/agency/partners/proposed-collaboration"]) {
    const res = await page.goto(route);
    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content");
    const header = res?.headers()["x-robots-tag"] ?? "";
    expect(`${robotsMeta} ${header}`, route).toContain("noindex");
  }
});

test("no broken internal links", async ({ page, request }) => {
  const seen = new Set<string>();
  for (const route of [...publicRoutes, "/agency/demo"]) {
    await page.goto(route);
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
    for (const href of hrefs) {
      if (!href.startsWith("/") || href.startsWith("//")) continue;
      seen.add(href.split("#")[0]!);
    }
  }
  const broken: string[] = [];
  for (const href of seen) {
    const res = await request.get(href);
    if (res.status() >= 400) broken.push(`${href} → ${res.status()}`);
  }
  expect(broken).toEqual([]);
});

test("no real-name or partnership claims are rendered", async ({ page }) => {
  const forbidden = /Manuchie|Gemma Griffiths|Jah Prayzah|Ruadhri Cushnan|Simba Moyo|Arts Capital/i;
  for (const route of [...publicRoutes, ...demoRoutes]) {
    await page.goto(route);
    const text = await page.locator("body").innerText();
    expect(forbidden.test(text), route).toBe(false);
  }
});
