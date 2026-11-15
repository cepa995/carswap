import { expect, test, type Page } from "@playwright/test";

const topCard = (page: Page) => page.locator("article").first();
// Located by tag, not role: an open dialog hides the page behind it from the accessibility tree.
const topTitle = (page: Page) => topCard(page).locator("h2");
const garageLink = (page: Page) => page.getByRole("link", { name: /^Garaža/ });

/** Drags the top card sideways with a real pointer, at a human pace. */
async function dragTopCard(page: Page, dx: number) {
  const box = await topCard(page).boundingBox();
  if (!box) throw new Error("No card on top of the deck");
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const steps = 12;
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (let step = 1; step <= steps; step += 1) {
    await page.mouse.move(start.x + (dx * step) / steps, start.y);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/swipe");
  await expect(topCard(page)).toBeVisible();
});

test("dragging a card past the threshold likes it without opening its details", async ({ page }) => {
  const title = await topTitle(page).innerText();

  await dragTopCard(page, 170);

  await expect(topTitle(page)).not.toHaveText(title);
  // Releasing a drag over the card must not count as a tap on it.
  await expect(page.getByRole("dialog", { name: title })).toHaveCount(0);
  await expect(garageLink(page)).toContainText("1");
});

test("a short drag lets the card spring back", async ({ page }) => {
  const title = await topTitle(page).innerText();

  await dragTopCard(page, 40);

  await expect(topTitle(page)).toHaveText(title);
  await expect(page.getByRole("button", { name: "Vrati prethodni" })).toBeDisabled();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("tapping a card opens its details", async ({ page }) => {
  const title = await topTitle(page).innerText();

  await topCard(page).click();

  await expect(page.getByRole("dialog", { name: title })).toBeVisible();
});

test("arrow keys swipe and Z takes the last swipe back", async ({ page }) => {
  const first = await topTitle(page).innerText();

  await page.keyboard.press("ArrowLeft");
  await expect(topTitle(page)).not.toHaveText(first);

  await page.keyboard.press("z");
  await expect(topTitle(page)).toHaveText(first);
});

test("with a car added, a like on a swap is a match that lands in the garage", async ({ page }) => {
  await page.getByRole("button", { name: "Dodaj svoj auto" }).click();
  await page.getByRole("button", { name: "Volkswagen", exact: true }).click();
  await page.getByRole("button", { name: "Golf", exact: true }).click();
  await page.getByRole("button", { name: "2011", exact: true }).click();
  await page.getByRole("button", { name: "Da vidimo koliko vredi" }).click();
  await expect(page.getByText("vredi oko")).toBeVisible();
  await page.getByRole("button", { name: "Daj da vidim" }).click();

  // Every card now leads with the swap, not the price.
  await expect(topCard(page)).toContainText("Može zamena");
  await expect(topCard(page)).toContainText(/Golf/i);
  const title = await topTitle(page).innerText();

  await page.getByRole("button", { name: "Menjam", exact: true }).click();

  const match = page.getByRole("dialog", { name: "Može zamena!" });
  await expect(match).toBeVisible();
  await match.getByRole("button", { name: "Otvori garažu" }).click();

  await expect(page).toHaveURL(/\/garage$/);
  await expect(page.getByRole("heading", { name: "Garaža" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: title })).toHaveCount(1);
});

test("swipes survive a reload", async ({ page }) => {
  const first = await topTitle(page).innerText();
  await page.keyboard.press("ArrowLeft");
  await expect(topTitle(page)).not.toHaveText(first);
  const second = await topTitle(page).innerText();

  await page.reload();

  await expect(topTitle(page)).toHaveText(second);
});

test("the deck keeps its place after a visit to the garage", async ({ page }) => {
  await page.keyboard.press("ArrowRight");
  await expect(garageLink(page)).toContainText("1");
  // The first like without a car asks what the visitor drives; not what this test is about.
  await page.getByRole("button", { name: "Zatvori" }).click();
  const next = await topTitle(page).innerText();

  await garageLink(page).click();
  await expect(page.getByRole("heading", { name: "Garaža" })).toBeVisible();
  await page.getByRole("link", { name: "Zamene" }).click();

  await expect(topTitle(page)).toHaveText(next);
});
