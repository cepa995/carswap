import { describe, expect, it } from "vitest";
import type { Deal } from "./domain/deal";
import type { Listing } from "./domain/types";
import {
  deckPath,
  equationLine,
  parseSwap,
  shareMessage,
  sharePath,
  slugify,
  swapSegments,
  swapToShare,
  viberLink,
  whatsappLink,
  type SharedSwap,
} from "./share";

const octavia = { id: "skoda-octavia-3", make: "Škoda", model: "Octavia", year: 2014, priceEur: 14_900 } as Listing;

const swap = (topUp: number, status: "swap" | "over-budget" = "swap"): Deal => ({
  status,
  credit: 0,
  topUp,
  creditRange: [0, 0],
  overBy: 0,
});

describe("slugify", () => {
  it("writes Serbian letters in plain ASCII", () => {
    expect(slugify("Škoda Octavia")).toBe("skoda-octavia");
    expect(slugify("Đurđevak Čačak Ćuprija Žabalj")).toBe("djurdjevak-cacak-cuprija-zabalj");
  });

  it("turns anything else into single dashes", () => {
    expect(slugify("ML / GLE")).toBe("ml-gle");
    expect(slugify(" C-HR ")).toBe("c-hr");
  });
});

describe("swapToShare", () => {
  it("shares a swap, whether or not it fits the sender's budget", () => {
    expect(swapToShare(swap(2400), "Golf")).toEqual({ model: "Golf", topUp: 2400 });
    expect(swapToShare(swap(6000, "over-budget"), "Golf")).toEqual({ model: "Golf", topUp: 6000 });
  });

  it("flattens a difference too small to matter into a straight swap", () => {
    expect(swapToShare(swap(100), "Golf")).toEqual({ model: "Golf", topUp: 0 });
    expect(swapToShare(swap(-150), "Golf")).toEqual({ model: "Golf", topUp: 0 });
  });

  it("has nothing to share without a car, or when the dealer will not take it", () => {
    expect(swapToShare(swap(2400), null)).toBeNull();
    expect(swapToShare({ status: "no-car" }, "Golf")).toBeNull();
    expect(swapToShare({ status: "not-accepted", reason: "km" }, "Golf")).toBeNull();
  });

  it("leaves out a car the catalogue does not know, since its link could not be read back", () => {
    expect(swapToShare(swap(2400), "Batmobil")).toBeNull();
  });
});

describe("sharePath", () => {
  it("spells the swap out in the address", () => {
    expect(sharePath("skoda-octavia-3", { model: "Golf", topUp: 2400 })).toBe(
      "/auto/skoda-octavia-3/golf/doplata-2400",
    );
    expect(sharePath("fiat-punto", { model: "Golf", topUp: -3600 })).toBe("/auto/fiat-punto/golf/kes-3600");
    expect(sharePath("opel-astra-j", { model: "ML / GLE", topUp: 0 })).toBe("/auto/opel-astra-j/ml-gle/kljuc-za-kljuc");
  });

  it("is just the car when there is no swap", () => {
    expect(sharePath("skoda-octavia-3", null)).toBe("/auto/skoda-octavia-3");
  });
});

describe("parseSwap", () => {
  it("reads back what sharePath wrote", () => {
    const cases: SharedSwap[] = [
      { model: "Golf", topUp: 2400 },
      { model: "Golf", topUp: -3600 },
      { model: "Golf", topUp: 0 },
      { model: "ML / GLE", topUp: 5000 },
    ];
    for (const shared of cases) {
      const { car, deal } = swapSegments(shared);
      expect(parseSwap(car, deal, octavia)).toEqual(shared);
    }
  });

  it("spells the model as the catalogue does, whatever the link says", () => {
    expect(parseSwap("golf", "doplata-2400", octavia)?.model).toBe("Golf");
  });

  it("rejects a car that is not in the catalogue", () => {
    expect(parseSwap("batmobil", "doplata-2400", octavia)).toBeNull();
    expect(parseSwap("Golf", "doplata-2400", octavia)).toBeNull();
  });

  it.each([
    "doplata-2401", // not a round amount
    "doplata-02400", // a second spelling of the same swap
    "doplata-100", // would be shown as a straight swap
    "doplata-200000", // out of range
    "doplata--2400",
    "doplata-",
    "popust-2400",
    "2400",
    "",
  ])("rejects the amount %j", (deal) => {
    expect(parseSwap("golf", deal, octavia)).toBeNull();
  });

  it("rejects a top-up that leaves nothing for the car", () => {
    expect(parseSwap("golf", "doplata-14900", octavia)).toBeNull();
    expect(parseSwap("golf", "doplata-20000", octavia)).toBeNull();
  });

  it("rejects a swap that credits the car at more than it could be worth", () => {
    // An Up costs about 15.000 new; nobody credits one at 14.700 plus 40.000 in cash.
    expect(parseSwap("up", "kes-40000", octavia)).toBeNull();
    expect(parseSwap("up", "doplata-200", octavia)).not.toBeNull();
  });
});

describe("equationLine", () => {
  it("adds the top-up on the sender's side", () => {
    expect(equationLine({ model: "Golf", topUp: 2400 }, "Škoda Octavia")).toBe("Golf + 2.400 € = Škoda Octavia");
  });

  it("puts the cash on the listing's side when the sender gets money back", () => {
    expect(equationLine({ model: "Golf", topUp: -3600 }, "Fiat Punto")).toBe("Golf = Fiat Punto + 3.600 € keša");
  });

  it("names a straight swap", () => {
    expect(equationLine({ model: "Golf", topUp: 0 }, "Opel Astra")).toBe("Golf = Opel Astra, ključ za ključ");
  });
});

describe("shareMessage", () => {
  const url = "https://example.test/auto/skoda-octavia-3/golf/doplata-2400";

  it("leads with the equation and ends with the link", () => {
    expect(shareMessage(octavia, { model: "Golf", topUp: 2400 }, url)).toBe(
      `Golf + 2.400 € = Škoda Octavia. Može zamena, pogledaj: ${url}`,
    );
  });

  it("falls back to the car and its price when there is no swap", () => {
    expect(shareMessage(octavia, null, url)).toBe(`Škoda Octavia, 2014, 14.900 €. Može zamena, pogledaj: ${url}`);
  });

  it("uses plain spaces only", () => {
    expect(shareMessage(octavia, { model: "Golf", topUp: 2400 }, url)).not.toMatch(/ /);
  });
});

describe("links", () => {
  it("hands the whole message to Viber and WhatsApp, encoded", () => {
    expect(viberLink("Golf + 2.400 € = Škoda")).toBe(
      "viber://forward?text=Golf%20%2B%202.400%20%E2%82%AC%20%3D%20%C5%A0koda",
    );
    expect(whatsappLink("a b")).toBe("https://wa.me/?text=a%20b");
  });

  it("opens the deck on the shared car", () => {
    expect(deckPath("skoda-octavia-3")).toBe("/swipe?auto=skoda-octavia-3");
  });
});
