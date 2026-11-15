import { expect, test, type Page } from "@playwright/test";

const topCard = (page: Page) => page.locator("article").first();
const topTitle = (page: Page) => topCard(page).locator("h2");

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
    // Only on the first load, so a reload keeps whatever the test did since.
    if (!window.localStorage.getItem("carswap:v1")) window.localStorage.setItem("carswap:v1", value);
  }, JSON.stringify(saved));
}

/** Passes the card on top and waits until it is gone. */
async function passTopCard(page: Page) {
  const title = await topTitle(page).innerText();
  await page.keyboard.press("ArrowLeft");
  await expect
    .poll(async () => ((await page.locator("article").count()) === 0 ? null : topTitle(page).innerText()))
    .not.toBe(title);
}

test.describe("which way to trade", () => {
  test("trading down deals only cars that leave the visitor with cash", async ({ page }) => {
    await withCar(page);
    await page.goto("/swipe");

    await page.getByRole("button", { name: /Doplata do/ }).click();
    const sheet = page.getByRole("dialog", { name: "Šta tražiš?" });
    await sheet.getByRole("radio", { name: /Jeftiniji/ }).click();
    await expect(sheet.getByText("Dobijam bar")).toBeVisible();
    await sheet.getByRole("button", { name: "Gotovo" }).click();

    await expect(page.getByRole("button", { name: "Jeftiniji · keš meni" })).toBeVisible();
    for (let dealt = 0; dealt < 3; dealt += 1) {
      await expect(topCard(page)).toContainText("i još dobijaš");
      await expect(topCard(page)).toContainText("Na ruke");
      await passTopCard(page);
    }
  });

  test("trading up leaves out cars that would pay cash back", async ({ page }) => {
    await withCar(page, { direction: "up" });
    await page.goto("/swipe");

    await expect(page.getByRole("button", { name: /Skuplji · do/ })).toBeVisible();
    for (let dealt = 0; dealt < 5; dealt += 1) {
      await expect(topCard(page)).not.toContainText("i još dobijaš");
      await passTopCard(page);
    }
  });

  test("when the deck runs out, it offers the other direction", async ({ page }) => {
    await withCar(page, { direction: "down" });
    await page.goto("/swipe");
    await expect(topCard(page)).toBeVisible();

    const done = page.getByRole("heading", { name: "To je sve za tvoj izbor" });
    while ((await page.locator("article").count()) > 0) await passTopCard(page);
    await expect(done).toBeVisible();

    await page.getByRole("button", { name: "Pogledaj i skuplje" }).click();

    await expect(topCard(page)).toBeVisible();
    await expect(page.getByRole("button", { name: /Doplata do/ })).toBeVisible();
  });

  test("the choice survives a reload", async ({ page }) => {
    await withCar(page);
    await page.goto("/swipe");
    await page.getByRole("button", { name: /Doplata do/ }).click();
    await page.getByRole("radio", { name: /Skuplji/ }).click();
    await page.getByRole("button", { name: "Gotovo" }).click();

    await page.reload();

    await expect(page.getByRole("button", { name: /Skuplji · do/ })).toBeVisible();
  });
});

test.describe("what a swap costs all in", () => {
  test("a card totals up the day and shows a year of registration", async ({ page }) => {
    await withCar(page, { direction: "up" });
    await page.goto("/swipe");

    await expect(topCard(page)).toContainText("Sve ukupno");
    await expect(topCard(page)).toContainText("Reg.");
  });

  test("the details break the total down", async ({ page }) => {
    await withCar(page, { direction: "up" });
    await page.goto("/swipe");
    const title = await topTitle(page).innerText();

    await topCard(page).click();

    const details = page.getByRole("dialog", { name: title });
    await expect(details.getByText("Porez na prenos")).toBeVisible();
    await expect(details.getByText(/PDV je već u ceni/)).toBeVisible();
    await expect(details.getByText("Plaćaš ukupno")).toBeVisible();
    await expect(details.getByText("Godina registracije")).toBeVisible();
  });

  test("without a car, a card still shows the tax and the registration", async ({ page }) => {
    await page.goto("/swipe");

    await expect(topCard(page)).toContainText("Porez na prenos");
    await expect(topCard(page)).toContainText("Reg.");
  });
});

test.describe("sending a car to someone", () => {
  test("a shared link shows the sender's swap and deals that car first", async ({ page }) => {
    await page.goto("/auto/skoda-octavia-3/golf/doplata-2400");

    // What a chat app reads to draw the preview.
    await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Golf + 2.400 € = Škoda Octavia",
    );
    await expect(page.locator('head meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);

    await expect(page.getByRole("heading", { level: 1, name: "Škoda Octavia" })).toBeVisible();
    await expect(page.getByText("Ko ti je poslao link, menja ovako:")).toBeVisible();

    await page.getByRole("link", { name: "Vidi šta može za tvoj auto" }).click();

    await expect(page).toHaveURL(/\/swipe$/);
    await expect(topTitle(page)).toHaveText("Škoda Octavia");
  });

  test("a link nobody has opened before already carries its preview in the head", async ({ request }) => {
    // Chat apps read the HTML as sent and run no scripts. A browser would hide a
    // title that arrived late by moving it into <head>, so this reads the bytes.
    const response = await request.get("/auto/renault-clio-4/megane/kljuc-za-kljuc");
    const html = await response.text();
    const head = html.slice(0, html.indexOf("</head>"));

    expect(response.status()).toBe(200);
    expect(head).toContain('property="og:title" content="Megane = Renault Clio, ključ za ključ"');
    expect(head).toContain('property="og:image"');
  });

  test("the preview image is a JPEG small enough for any messenger", async ({ page, request }) => {
    await page.goto("/auto/fiat-punto/golf/kes-3600");
    const address = await page.locator('head meta[property="og:image"]').getAttribute("content");
    const { pathname, search } = new URL(address ?? "");

    const response = await request.get(pathname + search);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/jpeg");
    expect((await response.body()).byteLength).toBeLessThan(300_000);
  });

  test("a link with numbers no swap could produce opens the car without them", async ({ page }) => {
    await page.goto("/auto/skoda-octavia-3/up/kes-40000");

    await expect(page).toHaveURL(/\/auto\/skoda-octavia-3$/);
    await expect(page.getByRole("heading", { level: 1, name: "Škoda Octavia" })).toBeVisible();
    await expect(page.getByText("Ko ti je poslao link, menja ovako:")).toHaveCount(0);
  });

  test("a link to a car that does not exist is a 404", async ({ page }) => {
    const response = await page.goto("/auto/no-such-car");

    expect(response?.status()).toBe(404);
  });

  test("a car that was passed comes back when someone sends a link to it", async ({ page }) => {
    await withCar(page, { swipes: { "skoda-octavia-3": "pass" }, history: ["skoda-octavia-3"] });

    await page.goto("/swipe?auto=skoda-octavia-3");

    await expect(topTitle(page)).toHaveText("Škoda Octavia");
    // The parameter is dropped, so swiping the car and reloading does not deal it again.
    await expect(page).toHaveURL(/\/swipe$/);
  });

  test("sharing from the details hands Viber the equation and a link that reads back", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await withCar(page, { direction: "up" });
    await page.goto("/swipe");
    const title = await topTitle(page).innerText();

    await topCard(page).click();
    await page.getByRole("button", { name: "Pošalji", exact: true }).click();

    const sheet = page.getByRole("dialog", { name: "Pošalji auto" });
    const href = await sheet.getByRole("link", { name: "Pošalji na Viber" }).getAttribute("href");
    expect(href).toMatch(/^viber:\/\/forward\?text=/);
    const message = decodeURIComponent((href ?? "").replace("viber://forward?text=", ""));
    expect(message).toMatch(/^Golf \+ [\d.]+ € = /);
    expect(message).toContain(`= ${title}. Može zamena, pogledaj: http`);

    await sheet.getByRole("button", { name: "Kopiraj link" }).click();
    await expect(sheet.getByRole("button", { name: "Kopirano" })).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(message.endsWith(copied)).toBe(true);

    // Whatever the app sends, the app can open: same car, same swap.
    await page.goto(new URL(copied).pathname);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByText("Ko ti je poslao link, menja ovako:")).toBeVisible();
  });

  test("without a car there is no swap to send, only the car", async ({ page }) => {
    await page.goto("/swipe");
    const title = await topTitle(page).innerText();

    await topCard(page).click();
    await page.getByRole("button", { name: "Pošalji", exact: true }).click();

    const sheet = page.getByRole("dialog", { name: "Pošalji auto" });
    await expect(sheet.getByText("Šalješ samo link ka ovom autu.")).toBeVisible();
    const href = await sheet.getByRole("link", { name: "Pošalji na Viber" }).getAttribute("href");
    const message = decodeURIComponent((href ?? "").replace("viber://forward?text=", ""));
    expect(message.startsWith(`${title}, `)).toBe(true);
    expect(message).toMatch(/\/auto\/[a-z0-9-]+$/);
  });
});
