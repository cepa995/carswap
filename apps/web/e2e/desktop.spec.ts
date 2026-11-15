import { expect, test, type Page } from "@playwright/test";

// A laptop: wide enough for the gallery, a mouse instead of a thumb.
test.use({ viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false });

const golf = { make: "Volkswagen", model: "Golf", year: 2011, km: 205_000, fuel: "diesel" };

/** Starts the visit with a car already entered, as a returning visitor would have. */
async function withCar(page: Page, state: Record<string, unknown> = {}) {
  const saved = {
    state: {
      car: golf,
      direction: "any",
      budget: 3000,
      minCash: 0,
      swipes: {},
      history: [],
      firstMatchSeen: true,
      ...state,
    },
    version: 1,
  };
  await page.addInitScript((value) => {
    if (!window.localStorage.getItem("carswap:v1")) window.localStorage.setItem("carswap:v1", value);
  }, JSON.stringify(saved));
}

const wall = (page: Page) => page.getByRole("main");
const cards = (page: Page) => wall(page).locator("article");
const garage = (page: Page) => page.getByRole("complementary", { name: "Garaža" });
const nameOf = (card: ReturnType<typeof cards>) => card.getByRole("heading").innerText();

const widerThanScreen = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe("the gallery", () => {
  test("shows the cars side by side, with the garage next to them", async ({ page }) => {
    await page.goto("/swipe");

    await expect(cards(page).first()).toBeVisible();
    expect(await cards(page).count()).toBeGreaterThan(8);
    await expect(garage(page)).toBeVisible();

    // A wall of cars, not a stack: the second hangs to the right of the first.
    const first = await cards(page).nth(0).boundingBox();
    const second = await cards(page).nth(1).boundingBox();
    expect(second?.y).toBe(first?.y);
    expect(second?.x).toBeGreaterThan((first?.x ?? 0) + (first?.width ?? 0));
  });

  test("Menjam parks the car in the garage", async ({ page }) => {
    await withCar(page);
    await page.goto("/swipe");
    const card = cards(page).first();
    const name = await nameOf(card);

    await card.getByRole("button", { name: /^Menjam/ }).click();

    await expect(garage(page).getByText(name, { exact: true })).toBeVisible();
    await expect(wall(page).getByRole("heading", { name, exact: true })).toHaveCount(0);
    await expect(page.getByRole("status")).toContainText("Može zamena");
    // Its picture flies over, and shows in its bay once it has landed.
    await expect(garage(page).locator("[data-bay] img").first()).toHaveCSS("opacity", "1");
    await expect(garage(page).getByLabel("U garaži: 1")).toBeVisible();
  });

  test("Dalje takes a car off the wall, and Z brings it back", async ({ page }) => {
    await withCar(page);
    await page.goto("/swipe");
    const name = await nameOf(cards(page).first());
    const heading = wall(page).getByRole("heading", { name, exact: true });

    await cards(page)
      .first()
      .getByRole("button", { name: /^Dalje/ })
      .click();
    await expect(heading).toHaveCount(0);

    await page.keyboard.press("z");
    await expect(heading).toBeVisible();
  });

  test("a parked car can be driven out again", async ({ page }) => {
    await withCar(page, { swipes: { "toyota-yaris-3": "like" }, history: ["toyota-yaris-3"] });
    await page.goto("/swipe");
    await expect(garage(page).getByText("Toyota Yaris", { exact: true })).toBeVisible();

    await garage(page).getByRole("button", { name: "Izbaci iz garaže: Toyota Yaris" }).click();

    await expect(garage(page).getByText("Toyota Yaris", { exact: true })).toHaveCount(0);
    await expect(garage(page).getByLabel("U garaži: 0")).toBeVisible();
  });

  test("the choice in the toolbar decides what hangs on the wall", async ({ page }) => {
    await withCar(page);
    await page.goto("/swipe");

    await page
      .getByRole("banner")
      .getByRole("radio", { name: /Jeftiniji/ })
      .click();

    await expect(page.getByRole("banner").getByText("Dobijam bar")).toBeVisible();
    await expect(cards(page).first()).toContainText("i još dobijaš");
    for (const card of await cards(page).all()) await expect(card).toContainText("i još dobijaš");
  });

  test("a photo opens the details, and Menjam there parks the car", async ({ page }) => {
    await withCar(page);
    await page.goto("/swipe");
    const name = await nameOf(cards(page).first());

    await cards(page)
      .first()
      .getByRole("button", { name: `${name}: Detalji` })
      .click();

    const details = page.getByRole("dialog", { name });
    await expect(details.getByText("Plaćaš ukupno")).toBeVisible();
    await details.getByRole("button", { name: "Menjam", exact: true }).click();

    await expect(details).toHaveCount(0);
    await expect(garage(page).getByText(name, { exact: true })).toBeVisible();
  });

  test("the first swap is celebrated once the car has parked", async ({ page }) => {
    await withCar(page, { firstMatchSeen: false });
    await page.goto("/swipe");
    const name = await nameOf(cards(page).first());

    await cards(page)
      .first()
      .getByRole("button", { name: /^Menjam/ })
      .click();

    await expect(garage(page).getByText(name, { exact: true })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Može zamena!" })).toBeVisible();
  });

  test("without a car, the toolbar asks for one and the cards show prices", async ({ page }) => {
    await page.goto("/swipe");

    await expect(page.getByRole("banner").getByRole("button", { name: "Dodaj svoj auto" })).toBeVisible();
    await expect(cards(page).first()).toContainText("Cena");
    await expect(cards(page).first()).toContainText("Porez na prenos");
  });

  for (const width of [1024, 1280, 1920]) {
    test(`nothing is wider than a ${width}px screen`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await withCar(page);
      await page.goto("/swipe");
      await expect(cards(page).first()).toBeVisible();

      expect(await widerThanScreen(page)).toBe(0);
      // The slider keeps room to be dragged, however full the toolbar is.
      const slider = await page.getByRole("banner").getByRole("slider").boundingBox();
      expect(slider?.width).toBeGreaterThan(90);
    });
  }
});

test.describe("on a big screen, sheets are dialogs", () => {
  test("the car form opens in the middle of the screen, with one way to close it", async ({ page }) => {
    await page.goto("/swipe");

    await page.getByRole("banner").getByRole("button", { name: "Dodaj svoj auto" }).click();

    const form = page.getByRole("dialog", { name: "Šta voziš?" });
    await expect(form).toBeVisible();
    await expect(form.getByRole("button", { name: "Zatvori" })).toHaveCount(1);
    // Not hanging off the bottom edge, as it does on a phone.
    await expect
      .poll(async () => {
        const box = await form.boundingBox();
        return box ? 900 - (box.y + box.height) : 0;
      })
      .toBeGreaterThan(20);
  });
});

test.describe("the garage and a shared car", () => {
  test("the garage lays its cars out side by side", async ({ page }) => {
    await withCar(page, {
      swipes: { "toyota-yaris-3": "like", "fiat-punto": "like", "ford-fiesta-7": "like" },
      history: ["toyota-yaris-3", "fiat-punto", "ford-fiesta-7"],
    });
    await page.goto("/garage");
    const items = page.getByRole("listitem");
    await expect(items).toHaveCount(3);

    const first = await items.nth(0).boundingBox();
    const second = await items.nth(1).boundingBox();
    expect(second?.y).toBe(first?.y);
    expect(second?.x).toBeGreaterThan(first?.x ?? 0);
  });

  test("a shared car shows its photo beside its facts", async ({ page }) => {
    await page.goto("/auto/skoda-octavia-3/golf/doplata-2400");

    const photo = await page.getByRole("img", { name: /Škoda Octavia/ }).boundingBox();
    const heading = await page.getByRole("heading", { level: 1, name: "Škoda Octavia" }).boundingBox();

    expect(heading?.x).toBeGreaterThan((photo?.x ?? 0) + (photo?.width ?? 0));
    expect(await widerThanScreen(page)).toBe(0);
  });
});
