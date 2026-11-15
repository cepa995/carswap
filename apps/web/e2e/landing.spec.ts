import { expect, test, type Page } from "@playwright/test";

/** One step of "Kako ide zamena" in the phone layout: its heading, its text and its piece of the app. */
const step = (page: Page, name: string) => page.locator("li", { has: page.getByRole("heading", { level: 3, name }) });
const topCard = (page: Page) => step(page, "Prevlači").locator("article").first();
const topTitle = (page: Page) => topCard(page).locator("h4");

/** A touch gesture sent through the browser's own input pipeline, so it can scroll as a thumb does. */
async function touchDrag(page: Page, from: { x: number; y: number }, by: { x: number; y: number }) {
  const client = await page.context().newCDPSession(page);
  const steps = 14;
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from] });
  for (let index = 1; index <= steps; index += 1) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: from.x + (by.x * index) / steps, y: from.y + (by.y * index) / steps }],
    });
    await page.waitForTimeout(16);
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

/**
 * How far the page's content sticks out past the screen, in pixels.
 *
 * Measured against the layout width, not `window.innerWidth`: a phone browser
 * answers content that is too wide by widening what it reports as the window,
 * which makes the two agree and hides the very thing being looked for.
 */
const widerThanScreen = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** Where each piece of the walkthrough that is on show stands, and how big it is. */
const pieceBoxes = (page: Page) =>
  page.locator("#kako [data-piece]:visible").evaluateAll((pieces) =>
    pieces.map((piece) => {
      const box = piece.getBoundingClientRect();
      return { top: Math.round(box.top), width: Math.round(box.width), height: Math.round(box.height) };
    }),
  );

async function centreOfTopCard(page: Page) {
  await topCard(page).evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
  const box = await topCard(page).boundingBox();
  if (!box) throw new Error("No card in the walkthrough's deck");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test.describe("how a swap goes, on a phone", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("the four steps follow each other down the page", async ({ page }) => {
    const section = page.locator("section", { has: page.getByRole("heading", { name: "Kako ide zamena" }) });

    // By what is shown: a step can carry a second wording for big screens, hidden here.
    await expect(section.getByRole("heading", { level: 3 })).toHaveText(
      ["Reci šta voziš", "Skuplji ili jeftiniji?", "Prevlači", "Može zamena"],
      { useInnerText: true },
    );
    // One under another, not side by side: the page is the phone.
    const lefts = await section
      .getByRole("heading", { level: 3 })
      .evaluateAll((headings) => headings.map((heading) => Math.round(heading.getBoundingClientRect().left)));
    expect(new Set(lefts).size).toBe(1);
  });

  test("the direction control is live: each answer brings a different kind of swap", async ({ page }) => {
    const direction = step(page, "Skuplji ili jeftiniji?");

    // Exact text: the same words are also announced, out of sight, for screen readers.
    await direction.getByRole("radio", { name: /Svejedno/ }).click();
    await expect(direction.getByText("Ključ za ključ", { exact: true })).toBeVisible();

    await direction.getByRole("radio", { name: /Jeftiniji/ }).click();
    await expect(direction.getByText("i još dobijaš", { exact: true })).toBeVisible();
  });

  test("the deck is the real one: Menjam likes the card and says it is a swap", async ({ page }) => {
    const deck = step(page, "Prevlači");
    const first = await topTitle(page).innerText();

    await deck.getByRole("button", { name: "Menjam" }).click();

    await expect(deck.getByRole("status")).toContainText("Može zamena");
    await expect(topTitle(page)).not.toHaveText(first);
  });

  test("the deck deals again when it runs out", async ({ page }) => {
    const deck = step(page, "Prevlači");

    for (let swiped = 0; swiped < 6; swiped += 1) {
      const title = await topTitle(page).innerText();
      await deck.getByRole("button", { name: "Dalje" }).click();
      await expect(topTitle(page)).not.toHaveText(title);
    }
  });

  test("a thumb moving up over the card scrolls the page and leaves the card alone", async ({ page }) => {
    const from = await centreOfTopCard(page);
    const title = await topTitle(page).innerText();
    const before = await page.evaluate(() => window.scrollY);

    await touchDrag(page, from, { x: 4, y: -220 });

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 100);
    await expect(topTitle(page)).toHaveText(title);
  });

  test("a thumb moving sideways swipes the card and leaves the page alone", async ({ page }) => {
    const from = await centreOfTopCard(page);
    const title = await topTitle(page).innerText();
    const before = await page.evaluate(() => window.scrollY);

    await touchDrag(page, from, { x: 190, y: 6 });

    await expect(topTitle(page)).not.toHaveText(title);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThan(4);
    // A card on its way out must not make the page wider than the screen.
    expect(await widerThanScreen(page)).toBe(0);
  });

  test("with reduced motion every step is already drawn", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(step(page, "Reci šta voziš")).toContainText("vredi oko");
    await expect(step(page, "Reci šta voziš")).toContainText("8.500");
    await expect(step(page, "Može zamena")).toContainText("Može zamena!");
  });
});

test.describe("pieces that play as they scroll into view", () => {
  test("a scene waits at its first frame until it is on screen, then plays", async ({ page }) => {
    await page.goto("/");
    const answers = step(page, "Reci šta voziš").locator("ul > li");

    // Further down the page, so not on screen yet. It must not sit there
    // finished, or it would be seen whole, vanish, and only then play.
    await expect(answers.first()).toHaveCSS("opacity", "0");

    await answers.first().evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));

    await expect(answers.last()).toHaveCSS("opacity", "1");
  });

  test("with reduced motion it is drawn finished from the start", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(step(page, "Reci šta voziš").locator("ul > li").last()).toHaveCSS("opacity", "1");
  });

  test.describe("when a piece is on screen as the page loads", () => {
    // A screen tall enough to hold the top of the walkthrough from the start,
    // as after a reload half-way down the page.
    test.use({ viewport: { width: 412, height: 2400 } });

    test("it is left as drawn, not hidden and played again", async ({ page }) => {
      await page.goto("/");
      const lastAnswer = step(page, "Reci šta voziš").locator("ul > li").last();

      // Watched for a while: the last answer is the last to arrive in a replay,
      // so if the scene had been hidden to play again it would show here.
      const lowest = await lastAnswer.evaluate(
        (element) =>
          new Promise<number>((resolve) => {
            let seen = 1;
            const until = performance.now() + 1500;
            const look = () => {
              seen = Math.min(seen, Number(getComputedStyle(element).opacity));
              if (performance.now() < until) requestAnimationFrame(look);
              else resolve(seen);
            };
            look();
          }),
      );

      expect(lowest).toBe(1);
    });
  });
});

/** "Zašto ne oglas?": what you get here, line for line against a classified ad. */
const versus = (page: Page) => page.locator("section", { has: page.getByRole("heading", { name: "Zašto ne oglas?" }) });
/** One line of it, by what it promises. */
const line = (page: Page, name: string) =>
  versus(page).locator("li", { has: page.getByRole("heading", { level: 3, name }) });
const ours = (page: Page, name: string) => line(page, name).locator('[data-side="ours"]');
const theirs = (page: Page, name: string) => line(page, name).locator('[data-side="theirs"]');

const PROMISES = [
  "Doplata piše uz svaki auto",
  "Sve ukupno, unapred",
  "Dovezeš svoj, odvezeš drugi",
  "Provereno pre potpisa",
  "Bez pisanja oglasa",
];

test.describe("why not an ad", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("five lines, each headed by what you get here", async ({ page }) => {
    await expect(versus(page).getByRole("heading", { level: 3 })).toHaveText(PROMISES);
  });

  test("every line names the ad's way of doing the same thing", async ({ page }) => {
    for (const promise of PROMISES) {
      await expect(theirs(page, promise)).toContainText("Preko oglasa");
    }
    await expect(theirs(page, "Doplata piše uz svaki auto")).toContainText("Koja je poslednja cena?");
    await expect(theirs(page, "Dovezeš svoj, odvezeš drugi")).toContainText("Prvo prodaš svoj");
  });

  test("every line has a figure to prove it, and two are worked out from the example car", async ({ page }) => {
    await expect(ours(page, "Dovezeš svoj, odvezeš drugi")).toContainText("1 dolazak");
    await expect(ours(page, "Provereno pre potpisa")).toContainText("3 provere");
    await expect(ours(page, "Bez pisanja oglasa")).toContainText("10 sekundi");

    // The deal as a card words it.
    await expect(ours(page, "Doplata piše uz svaki auto")).toContainText(/Golf\s*\+\s*[\d.]+\s€/);

    // And what it all comes to: the very amount on the first card of the deck above.
    const onTheCard = await topCard(page)
      .getByText(/Sve ukupno/)
      .innerText();
    const amount = onTheCard.match(/[\d.]+\s€/)?.[0];
    expect(amount).toBeTruthy();
    await expect(ours(page, "Sve ukupno, unapred")).toContainText(`oko ${amount}`);
  });

  test("the lines wait until the board is on screen, then arrive", async ({ page }) => {
    const first = ours(page, PROMISES[0]);
    await expect(first).toHaveCSS("opacity", "0");

    await first.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));

    const last = PROMISES[PROMISES.length - 1];
    await expect(ours(page, last)).toHaveCSS("opacity", "1");
    await expect(theirs(page, last)).toHaveCSS("opacity", "1");
  });

  test("on a phone each line is one card: what you get on top, the ad's way under it", async ({ page }) => {
    await versus(page).evaluate((element) => element.scrollIntoView({ block: "start", behavior: "instant" }));
    await expect(ours(page, PROMISES[PROMISES.length - 1])).toHaveCSS("opacity", "1");

    for (const promise of PROMISES) {
      const top = await ours(page, promise).boundingBox();
      const under = await theirs(page, promise).boundingBox();
      if (!top || !under) throw new Error(`Line not drawn: ${promise}`);

      expect(Math.round(under.x)).toBe(Math.round(top.x));
      expect(Math.round(under.width)).toBe(Math.round(top.width));
      expect(under.y).toBeGreaterThanOrEqual(top.y + top.height - 1);
    }
  });
});

test.describe("questions", () => {
  test("an answer about something the app shows, shows it", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section", { has: page.getByRole("heading", { name: "Česta pitanja" }) });

    // The first is open to begin with, and shows the estimate as the range it is.
    await expect(section.locator("details[open]")).toHaveCount(1);
    await expect(section.locator("details[open]")).toContainText("vredi oko");

    await section.getByText("Šta ako je auto koji želim jeftiniji od mog?").click();

    const cheaper = section.locator("details", { hasText: "Šta ako je auto koji želim jeftiniji od mog?" });
    await expect(cheaper.getByText("i još dobijaš", { exact: true })).toBeVisible();
  });
});

test.describe("on the narrowest phones", () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test("nothing on the landing page is wider than the screen", async ({ page }) => {
    await page.goto("/");

    // Down the whole page, so every piece has made its entrance and holds its final place.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let top = 0; top < height; top += 400) {
      await page.evaluate((to) => window.scrollTo({ top: to, behavior: "instant" }), top);
      await page.waitForTimeout(120);
    }
    await expect(page.getByRole("link", { name: "Fotografije: Wikimedia Commons" })).toBeVisible();

    expect(await widerThanScreen(page)).toBe(0);
  });
});

test.describe("the landing page on a big screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("the four steps stand side by side, and step three is about parking", async ({ page }) => {
    const headings = page
      .locator("section", { has: page.getByRole("heading", { name: "Kako ide zamena" }) })
      .getByRole("heading", { level: 3 });

    await expect(headings).toHaveText(
      ["Reci šta voziš", "Skuplji ili jeftiniji?", "Parkiraj šta ti se sviđa", "Može zamena"],
      { useInnerText: true },
    );
    const tops = await headings.evaluateAll((all) =>
      all.map((heading) => Math.round(heading.getBoundingClientRect().top)),
    );
    expect(new Set(tops).size).toBe(1);
  });

  test("Menjam in step three parks the car in the little garage under it", async ({ page }) => {
    const park = step(page, "Parkiraj šta ti se sviđa");
    // The phone's deck is in the page too, hidden: look at what is shown. And
    // the last one shown, since a card on its way out lingers for a moment.
    const name = park.locator("h4:visible").last();
    const first = await name.innerText();

    await park.getByRole("button", { name: /^Menjam/ }).click();

    // The next car is on the card, and a bay of the garage is taken.
    await expect(name).not.toHaveText(first);
    await expect(park.locator("[data-bay]").first()).toBeVisible();
    // Once the picture has landed it shows in its bay.
    await expect(park.locator("[data-bay] img").first()).toHaveCSS("opacity", "1");
    // And the match beside it is for a car from that garage.
    await expect(step(page, "Može zamena")).toContainText("Može zamena!");
  });

  test("the four pieces are cards of one size, standing on one line", async ({ page }) => {
    const boxes = await pieceBoxes(page);

    expect(boxes).toHaveLength(4);
    expect(new Set(boxes.map((box) => box.width)).size).toBe(1);
    expect(new Set(boxes.map((box) => box.height)).size).toBe(1);
    expect(new Set(boxes.map((box) => box.top)).size).toBe(1);
  });

  test("the match in step four waits for the car in step three to be parked", async ({ page }) => {
    const steps = page.locator("#kako ol");
    // Waiting for its turn below the fold: nothing of the match is drawn yet.
    await expect(steps.locator('[data-piece="match"]').getByText("Može zamena!")).toHaveCSS("opacity", "0");

    // Watched frame by frame from the moment the row comes on screen.
    const order = await steps.evaluate(
      (list) =>
        new Promise<string[]>((resolve) => {
          list.scrollIntoView({ block: "center", behavior: "instant" });
          const title = [...list.querySelectorAll('[data-piece="match"] p')].find((p) =>
            p.textContent?.includes("Može zamena!"),
          );
          const seen: string[] = [];
          const until = performance.now() + 12_000;
          const look = () => {
            if (!seen.includes("parked") && list.querySelector("[data-bay]")) seen.push("parked");
            if (!seen.includes("match") && title && Number(getComputedStyle(title).opacity) > 0) seen.push("match");
            if (seen.length < 2 && performance.now() < until) requestAnimationFrame(look);
            else resolve(seen);
          };
          look();
        }),
    );

    expect(order).toEqual(["parked", "match"]);
  });

  test("the header keeps to the same column as the page under it", async ({ page }) => {
    const mark = await page.getByRole("banner").getByRole("link", { name: "carswap" }).boundingBox();
    const headline = await page.getByRole("heading", { level: 1 }).boundingBox();

    expect(Math.round(mark?.x ?? -1)).toBe(Math.round(headline?.x ?? -2));
  });

  test("each thing you get stands beside the ad's way of doing it, and is the larger of the two", async ({ page }) => {
    await versus(page).evaluate((element) => element.scrollIntoView({ block: "start", behavior: "instant" }));
    await expect(ours(page, PROMISES[PROMISES.length - 1])).toHaveCSS("opacity", "1");

    for (const promise of PROMISES) {
      const right = await ours(page, promise).boundingBox();
      const left = await theirs(page, promise).boundingBox();
      if (!right || !left) throw new Error(`Line not drawn: ${promise}`);

      // One line across both panels: the ad's way on the left, ours facing it.
      expect(Math.round(left.y)).toBe(Math.round(right.y));
      expect(Math.round(left.height)).toBe(Math.round(right.height));
      expect(left.x + left.width).toBeLessThanOrEqual(right.x);
      expect(right.width).toBeGreaterThan(left.width);
    }

    // What you get is the big print, and the ad's way the small.
    const size = (locator: ReturnType<typeof ours>) =>
      locator.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
    const promise = await size(ours(page, PROMISES[0]).getByRole("heading"));
    const figure = await size(ours(page, PROMISES[0]).locator("p").last());
    const adsWay = await size(theirs(page, PROMISES[0]));
    expect(promise).toBeGreaterThan(adsWay);
    expect(figure).toBeGreaterThan(adsWay);
  });

  test("nothing on the landing page is wider than the screen", async ({ page }) => {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let top = 0; top < height; top += 600) {
      await page.evaluate((to) => window.scrollTo({ top: to, behavior: "instant" }), top);
      await page.waitForTimeout(120);
    }

    expect(await widerThanScreen(page)).toBe(0);
  });

  test.describe("with room for only two steps to a row", () => {
    test.use({ viewport: { width: 1100, height: 800 } });

    test("the four pieces are still one size, in two rows of two", async ({ page }) => {
      const boxes = await pieceBoxes(page);

      expect(boxes).toHaveLength(4);
      expect(new Set(boxes.map((box) => box.width)).size).toBe(1);
      expect(new Set(boxes.map((box) => box.height)).size).toBe(1);
      expect(new Set(boxes.map((box) => box.top)).size).toBe(2);
    });
  });
});
