import { test } from "@playwright/test";
import { at, widths } from "./routes";

// Full-page screenshots for responsive review. Reduced motion renders every
// scroll scene in its finished state. Output: screenshots/<width>/<route>.png
const routes = ["/", "/roster", "/roster/msasa-room", "/services", "/how-it-works", "/artist-business-suite", "/websites", "/contact", "/apply", "/partners/proposed-collaboration", "/demo", "/demo/company/overview", "/demo/company/finance", "/demo/artist/msasa-room/overview", "/demo/artist/kopje-sound/overview", "/demo/client/overview", "/demo/partner/overview"].map(at);

test.skip(!process.env.SCREENSHOTS, "Set SCREENSHOTS=1 to capture");

for (const width of widths) {
  for (const route of routes) {
    test(`screenshot ${width} ${route}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      const name = route === "/agency" ? "home" : route.slice("/agency/".length).replace(/\//g, "_");
      await page.screenshot({ path: `screenshots/agency/${width}/${name}.png`, fullPage: true });
    });
  }
}
