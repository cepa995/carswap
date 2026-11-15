import { describe, expect, it } from "vitest";
import {
  buildDeck,
  countSwaps,
  nextBudgetStep,
  RECENT_STOCK_YEARS,
  remaining,
  STRETCH_LIMIT,
  type DeckInput,
} from "./deck";
import type { Dealer, Listing, UserCar } from "./types";

const YEAR = 2026;

const dealers: Dealer[] = [
  { id: "open", name: "Open", area: "A", city: "NS", rules: { creditFactor: 1, maxAgeYears: 30, maxKm: 500_000 } },
  { id: "strict", name: "Strict", area: "B", city: "NS", rules: { creditFactor: 1, maxAgeYears: 5, maxKm: 500_000 } },
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
});

describe("nextBudgetStep", () => {
  it("finds the smallest raise that brings another car within reach", () => {
    expect(nextBudgetStep(input())).toEqual({ budget: 4500, extra: 1 });
  });

  it("says so when no raise would help", () => {
    expect(nextBudgetStep(input({ budget: 20_000 }))).toBeNull();
  });
});

describe("remaining", () => {
  it("leaves out cards that were already swiped either way", () => {
    const deck = buildDeck(input());
    const left = remaining(deck, { cheap: "like", fits: "pass" });
    expect(ids(left).sort()).toEqual(["edge", "stretch"]);
  });
});
