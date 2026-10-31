import { expect, test, type Page } from "@playwright/test";

// The server rejects submissions completed in under 2.5 s; real people never are.
const humanPause = (page: Page) => page.waitForTimeout(2700);

async function fillBrief(page: Page) {
  await page.getByLabel("Your name").fill("Test Client");
  await page.getByLabel("Email").fill(`client+${Date.now()}@example.com`);
  await page.getByLabel("You are").selectOption("label");
  await page.getByLabel("Based in").fill("Harare, Zimbabwe");
  await page.getByRole("checkbox", { name: "Mixing" }).check();
  await page.getByLabel("Budget range").selectOption("5k-15k");
  await page.getByLabel("Timeline").selectOption("6-12-weeks");
  await page.getByLabel("The brief").fill("A six-song EP blending gospel choir arrangements with modern Afropop production, delivered with stems.");
  await page.getByRole("checkbox", { name: /I have read the privacy notice/ }).check();
}

test.describe("project brief", () => {
  test("shows an error summary and inline errors, then submits", async ({ page }) => {
    await page.goto("/agency/contact");
    await page.getByRole("button", { name: "Send the brief" }).click();
    const summary = page.locator("#error-summary");
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");

    await fillBrief(page);
    await expect(page.getByRole("checkbox", { name: /Send me occasional news/ })).not.toBeChecked();
    await humanPause(page);
    await page.getByRole("button", { name: "Send the brief" }).click();
    await expect(page.getByText("Brief received")).toBeVisible();
    await expect(page.locator(".reference")).toHaveText(/^ENQ-[A-Z0-9]{6}$/);
  });

  test("keeps every answer when the server is unavailable", async ({ page }) => {
    await page.route("**/api/enquiries", (route) => route.fulfill({ status: 503, json: { ok: false, message: "We could not save your submission just now. Nothing was lost — please try again in a moment." } }));
    await page.goto("/agency/contact");
    await fillBrief(page);
    await humanPause(page);
    await page.getByRole("button", { name: "Send the brief" }).click();
    await expect(page.locator(".form-status--error")).toContainText("Nothing was lost");
    await expect(page.getByLabel("Your name")).toHaveValue("Test Client");
    await expect(page.getByLabel("The brief")).toHaveValue(/six-song EP/);
    await expect(page.getByRole("checkbox", { name: "Mixing" })).toBeChecked();
  });
});

test.describe("roster application", () => {
  test("submits a complete application", async ({ page }) => {
    await page.goto("/agency/apply");
    await page.getByLabel("Your name").fill("Test Creative");
    await page.getByLabel("Email").fill(`creative+${Date.now()}@example.com`);
    await page.getByLabel("Country").fill("Zimbabwe");
    await page.getByRole("checkbox", { name: "Producer" }).check();
    await page.getByRole("checkbox", { name: "Gospel" }).check();
    await page.getByLabel("Experience").selectOption("established");
    await page.getByLabel("Links to your work 1").fill("https://example.com/work");
    await page.getByLabel("About your work").fill("Producer and arranger focused on vocal-led records and remote collaboration across Africa.");
    await page.getByRole("checkbox", { name: /I have the right to share/ }).check();
    await page.getByRole("checkbox", { name: /I have read the privacy notice/ }).check();
    await humanPause(page);
    await page.getByRole("button", { name: "Send my application" }).click();
    await expect(page.getByText("Application received")).toBeVisible();
    await expect(page.locator(".reference")).toHaveText(/^APP-[A-Z0-9]{6}$/);
  });
});
