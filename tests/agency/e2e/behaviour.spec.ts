import { expect, test } from "@playwright/test";

test.describe("keyboard and motion", () => {
  test("skip link is the first stop and moves focus to main", async ({ page }) => {
    await page.goto("/agency/about");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });

  test("reduced motion shows all content without waiting for scroll", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/agency");
    const hidden = await page.$$eval(".reveal", (els) => els.filter((el) => getComputedStyle(el).opacity !== "1").length);
    expect(hidden).toBe(0);
  });
});

test.describe("mobile navigation dialog", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens as a modal, traps the page, closes on Escape and restores focus", async ({ page }) => {
    await page.goto("/agency");
    const trigger = page.getByRole("button", { name: "Menu" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
    // The page behind a modal <dialog> is inert.
    expect(await page.evaluate(() => document.querySelector("dialog")?.matches(":modal"))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("navigates and closes", async ({ page }) => {
    await page.goto("/agency");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Roster", exact: true }).click();
    await expect(page).toHaveURL(/\/roster$/);
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test.describe("roster", () => {
  test("filters are shareable links and the back button restores them", async ({ page }) => {
    await page.goto("/agency/roster");
    const status = page.getByRole("status").filter({ hasText: "sample profiles" });
    await expect(status).toHaveText("8 of 8 sample profiles");

    await page.getByLabel("Role", { exact: true }).selectOption("producer");
    await expect(page).toHaveURL(/role=producer/);
    await expect(status).toHaveText("1 of 8 sample profiles");

    await page.getByLabel("Based in", { exact: true }).selectOption("Zimbabwe");
    await expect(page).toHaveURL(/country=Zimbabwe/);

    await page.goBack();
    await expect(page).toHaveURL(/role=producer$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/roster$/);
    await expect(status).toHaveText("8 of 8 sample profiles");

    await page.goto("/agency/roster?remote=1&genre=jazz");
    await expect(page.getByLabel("Genre", { exact: true })).toHaveValue("jazz");
    await expect(page.getByLabel("Remote delivery only")).toBeChecked();
  });

  test("every card is labelled as a sample and links to a deep-linkable profile", async ({ page }) => {
    await page.goto("/agency/roster");
    const cards = page.locator(".talent-card");
    await expect(cards).toHaveCount(8);
    await expect(cards.filter({ hasText: "Sample profile" })).toHaveCount(8);
    await cards.first().getByRole("link").click();
    await expect(page).toHaveURL(/\/roster\/[a-z-]+$/);
    await expect(page.getByText("Sample profile — fictional")).toBeVisible();
  });

  test("request-for-project pre-selects the creative and service in the brief", async ({ page }) => {
    await page.goto("/agency/roster/msasa-room");
    await page.getByRole("link", { name: "Request for a project" }).click();
    await expect(page).toHaveURL(/talent=msasa-room/);
    await expect(page.getByRole("button", { name: /Remove Msasa Room/ })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Music production and arrangement" })).toBeChecked();
  });

  test("the shared player plays one track at a time", async ({ page }) => {
    await page.goto("/agency/roster");
    const buttons = page.locator(".talent-card .play-button");
    await buttons.nth(0).click();
    await expect(page.getByRole("region", { name: "Audio player" })).toBeVisible();
    await expect(buttons.nth(0)).toHaveAttribute("aria-pressed", "true");
    await buttons.nth(1).click();
    await expect(buttons.nth(0)).toHaveAttribute("aria-pressed", "false");
    await expect(buttons.nth(1)).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Close player" }).click();
    await expect(page.getByRole("region", { name: "Audio player" })).toBeHidden();
  });
});
