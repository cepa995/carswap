import { describe, expect, it } from "vitest";
import {
  buildDeck,
  countSwaps,
  nextSuggestion,
  otherDirectionCount,
  RECENT_STOCK_YEARS,
  remaining,
  STRETCH_LIMIT,
  type DeckInput,
} from "./deck";
import type { Dealer, Listing, UserCar } from "./types";

const YEAR = 2026;

const dealers: Dealer[] = [
  {
    id: "open",
    name: "Open",
    area: "A",
    city: "NS",
    chargesVat: true,
    rules: { creditFactor: 1, maxAgeYears: 30, maxKm: 500_000 },
  },
  {
    id: "strict",
    name: "Strict",
    area: "B",
    city: "NS",
    chargesVat: true,
    rules: { creditFactor: 1, maxAgeYears: 5, maxKm: 500_000 },
  },
];

const listing = (id: string, priceEur: number, dealerId = "open"): Listing => ({
  id,
  dealerId,
  make: "Make",
  model: id,
  variant: "",
  year: 2016,
  km: 150_000,
  fuel: "diesel",
  gearbox: "manual",
  powerKw: 80,
  engineCc: 1461,
  body: "hatchback",
  color: "bela",
  priceEur,
  highlights: [],
  photo: {
    src: "/x.webp",
    width: 1280,
    height: 853,
    blur: "data:,",
    credit: { author: "a", license: "CC0", licenseUrl: "", sourceUrl: "" },
  },
});

const car: UserCar = { make: "Volkswagen", model: "Golf", year: 2012, km: 190_000, fuel: "diesel" };

const listings = [
  listing("cheap", 4000),
  listing("fits", 7500),
  listing("edge", 8000),
  listing("stretch", 9500),
  listing("far", 14_000),
  listing("refused", 6000, "strict"),
];

const input = (overrides: Partial<DeckInput> = {}): DeckInput => ({
  listings,
  dealers,
  car,
  estimate: { low: 4500, mid: 5000, high: 5500 },
  budget: 3000,
  direction: "any",
  minCash: 0,
  currentYear: YEAR,
  ...overrides,
});

const ids = (deck: ReturnType<typeof buildDeck>) => deck.map((card) => card.listing.id);

describe("buildDeck", () => {
  it("shows every listing to a visitor who has not added a car", () => {
    const deck = buildDeck(input({ car: null, estimate: null }));
    expect(ids(deck).sort()).toEqual(listings.map((l) => l.id).sort());
  });

  it("leads with newer stock for a visitor who has not added a car", () => {
    const old = { ...listing("old", 3000), year: YEAR - RECENT_STOCK_YEARS - 1 };
    const borderline = { ...listing("borderline", 9000), year: YEAR - RECENT_STOCK_YEARS };
    const fresh = { ...listing("fresh", 15_000), year: YEAR - 2 };
    const deck = buildDeck(input({ listings: [old, borderline, fresh], car: null, estimate: null }));
    expect(ids(deck).slice(0, 2).sort()).toEqual(["borderline", "fresh"]);
    expect(ids(deck).at(-1)).toBe("old");
  });

  it("deals swaps within budget first, then near misses, and drops the rest", () => {
    const deck = buildDeck(input());
    expect(ids(deck).slice(0, 3).sort()).toEqual(["cheap", "edge", "fits"]);
    expect(ids(deck).slice(3)).toEqual(["stretch"]);
    expect(ids(deck)).not.toContain("far");
    expect(ids(deck)).not.toContain("refused");
  });

  it("orders near misses by how far over budget they are", () => {
    const more = [...listings, listing("stretch-less", 8500)];
    const deck = buildDeck(input({ listings: more }));
    expect(ids(deck).slice(-2)).toEqual(["stretch-less", "stretch"]);
  });

  it("includes a near miss right at the stretch limit and nothing beyond it", () => {
    const atLimit = listing("at-limit", 5000 + 3000 + STRETCH_LIMIT);
    const beyond = listing("beyond", 5000 + 3000 + STRETCH_LIMIT + 100);
    const deck = buildDeck(input({ listings: [atLimit, beyond] }));
    expect(ids(deck)).toEqual(["at-limit"]);
  });

  it("deals the same order every time for the same car", () => {
    expect(ids(buildDeck(input()))).toEqual(ids(buildDeck(input())));
  });
});

describe("countSwaps", () => {
  it("counts only swaps that fit the budget", () => {
    expect(countSwaps(input())).toBe(3);
    expect(countSwaps(input({ budget: 0 }))).toBe(1);
    expect(countSwaps(input({ budget: 10_000 }))).toBe(5);
  });

  it("leaves out cars that were already swiped", () => {
    expect(countSwaps(input(), { fits: "pass", cheap: "like" })).toBe(1);
  });
});

describe("costs on a card", () => {
  it("come with every card, with or without a car", () => {
    for (const deck of [buildDeck(input()), buildDeck(input({ car: null, estimate: null }))]) {
      for (const card of deck) {
        expect(card.costs.paperwork).toBeGreaterThan(0);
        expect(card.costs.registration[0]).toBeLessThanOrEqual(card.costs.registration[1]);
      }
    }
  });
});

describe("direction", () => {
  // With the car worth 5.000: "cheap" (4.000) pays 1.000 back, the rest need a top-up.
  it("trading up leaves out cars that would pay cash back", () => {
    const deck = buildDeck(input({ direction: "up" }));
    expect(ids(deck)).not.toContain("cheap");
    expect(ids(deck).slice(0, 2).sort()).toEqual(["edge", "fits"]);
    expect(countSwaps(input({ direction: "up" }))).toBe(2);
  });

  it("trading down shows only cars that pay cash back, and no near misses", () => {
    const deck = buildDeck(input({ direction: "down" }));
    expect(ids(deck)).toEqual(["cheap"]);
  });

  it("trading down respects the least cash the visitor will take", () => {
    expect(countSwaps(input({ direction: "down", minCash: 1000 }))).toBe(1);
    expect(countSwaps(input({ direction: "down", minCash: 1500 }))).toBe(0);
  });

  it("a straight swap counts as trading up, not down", () => {
    const even = [listing("even", 5100)];
    expect(countSwaps(input({ listings: even, direction: "up", budget: 500 }))).toBe(1);
    expect(countSwaps(input({ listings: even, direction: "down" }))).toBe(0);
  });
});

describe("pinned listing", () => {
  it("is dealt first even when it is not a swap the visitor asked for", () => {
    const deck = buildDeck(input({ pinnedId: "far" }));
    expect(ids(deck)[0]).toBe("far");
    expect(ids(deck).filter((id) => id === "far")).toHaveLength(1);
  });

  it("is ignored when no listing has that id", () => {
    expect(ids(buildDeck(input({ pinnedId: "missing" })))).toEqual(ids(buildDeck(input())));
  });
});

describe("nextSuggestion", () => {
  it("finds the smallest raise that brings another car within reach", () => {
    expect(nextSuggestion(input())).toEqual({ kind: "raise-budget", budget: 4500, extra: 1 });
  });

  it("says so when no raise would help", () => {
    expect(nextSuggestion(input({ budget: 20_000 }))).toBeNull();
  });

  it("suggests taking less cash when trading down finds nothing", () => {
    expect(nextSuggestion(input({ direction: "down", minCash: 2000 }))).toEqual({
      kind: "accept-less-cash",
      minCash: 1000,
      extra: 1,
    });
  });

  it("has nothing to suggest when trading down already asks for no minimum", () => {
    expect(nextSuggestion(input({ direction: "down", listings: [listing("fits", 7500)] }))).toBeNull();
  });

  it("does not count a car that was already swiped as a reason to raise the budget", () => {
    // "stretch" (4.500 top-up) was dealt as a near miss and passed; the next new car is "far" at 9.000.
    expect(nextSuggestion(input(), { stretch: "pass" })).toEqual({ kind: "raise-budget", budget: 9000, extra: 1 });
  });
});

describe("otherDirectionCount", () => {
  it("counts what trading in either direction would add", () => {
    expect(otherDirectionCount(input({ direction: "up" }))).toBe(1);
    expect(otherDirectionCount(input({ direction: "down" }))).toBe(2);
  });

  it("is zero when the visitor already takes either direction", () => {
    expect(otherDirectionCount(input())).toBe(0);
  });

  it("leaves out cars that were already swiped", () => {
    expect(otherDirectionCount(input({ direction: "up" }), { cheap: "pass" })).toBe(0);
  });
});

describe("remaining", () => {
  it("leaves out cards that were already swiped either way", () => {
    const deck = buildDeck(input());
    const left = remaining(deck, { cheap: "like", fits: "pass" });
    expect(ids(left).sort()).toEqual(["edge", "stretch"]);
  });
});
