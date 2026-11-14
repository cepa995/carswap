import { describe, expect, it } from "vitest";
import { computeDeal, dealShape } from "./deal";
import type { Dealer, Estimate, Listing, UserCar } from "./types";

const YEAR = 2026;

const dealer: Dealer = {
  id: "d",
  name: "Test Auto",
  area: "Centar",
  city: "Novi Sad",
  rules: { creditFactor: 0.9, maxAgeYears: 15, maxKm: 250_000 },
};

const listing = (priceEur: number): Listing => ({
  id: "l",
  dealerId: "d",
  make: "Škoda",
  model: "Octavia",
  variant: "2.0 TDI",
  year: 2015,
  km: 180_000,
  fuel: "diesel",
  gearbox: "manual",
  powerKw: 110,
  body: "wagon",
  color: "plava",
  priceEur,
  highlights: [],
  photo: {
    src: "/x.webp",
    width: 1280,
    height: 853,
    blur: "data:,",
    tint: "#000000",
    credit: { author: "a", license: "CC0", licenseUrl: "", sourceUrl: "" },
  },
});

const car: UserCar = { make: "Volkswagen", model: "Golf", year: 2012, km: 190_000, fuel: "diesel" };
const estimate: Estimate = { low: 6000, mid: 7000, high: 8000 };

describe("computeDeal", () => {
  it("has nothing to say until it knows the visitor's car", () => {
    expect(computeDeal(listing(10_000), dealer, null, null, 3000, YEAR)).toEqual({ status: "no-car" });
  });

  it("credits the dealer's share of the mid estimate and asks for the rest", () => {
    const deal = computeDeal(listing(9000), dealer, car, estimate, 3000, YEAR);
    expect(deal).toMatchObject({ status: "swap", credit: 6300, topUp: 2700, overBy: 0 });
  });

  it("gives the credit as a range from the low to the high estimate", () => {
    const deal = computeDeal(listing(9000), dealer, car, estimate, 3000, YEAR);
    expect(deal).toMatchObject({ creditRange: [5400, 7200] });
  });

  it("flags a top-up above budget and says by how much", () => {
    const deal = computeDeal(listing(11_000), dealer, car, estimate, 3000, YEAR);
    expect(deal).toMatchObject({ status: "over-budget", topUp: 4700, overBy: 1700 });
  });

  it("treats a top-up exactly at budget as within budget", () => {
    const deal = computeDeal(listing(9300), dealer, car, estimate, 3000, YEAR);
    expect(deal).toMatchObject({ status: "swap", topUp: 3000 });
  });

  it("returns cash to the visitor when the listing is cheaper than the credit", () => {
    const deal = computeDeal(listing(4000), dealer, car, estimate, 0, YEAR);
    expect(deal).toMatchObject({ status: "swap", topUp: -2300 });
  });

  it("refuses a car older than the dealer accepts", () => {
    const old = { ...car, year: 2010 };
    expect(computeDeal(listing(9000), dealer, old, estimate, 3000, YEAR)).toEqual({
      status: "not-accepted",
      reason: "age",
    });
  });

  it("accepts a car exactly at the age limit", () => {
    const atLimit = { ...car, year: 2011 };
    expect(computeDeal(listing(9000), dealer, atLimit, estimate, 3000, YEAR).status).toBe("swap");
  });

  it("refuses a car with more mileage than the dealer accepts", () => {
    const tired = { ...car, km: 260_000 };
    expect(computeDeal(listing(9000), dealer, tired, estimate, 3000, YEAR)).toEqual({
      status: "not-accepted",
      reason: "km",
    });
  });
});

describe("dealShape", () => {
  it("calls a small difference either way a straight swap", () => {
    expect(dealShape(100)).toBe("even");
    expect(dealShape(-150)).toBe("even");
  });

  it("separates paying in from getting cash back", () => {
    expect(dealShape(2400)).toBe("top-up");
    expect(dealShape(-1500)).toBe("cash-back");
  });
});
