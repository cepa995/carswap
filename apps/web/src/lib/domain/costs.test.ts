import { describe, expect, it } from "vitest";
import {
  dayTotal,
  estimateCosts,
  PAPERWORK_RSD,
  registrationRsd,
  rsdToEur,
  transferTaxRsd,
  usageTaxRsd,
  type CostEstimate,
} from "./costs";
import type { Dealer, Listing } from "./types";

const YEAR = 2026;

describe("transferTaxRsd", () => {
  it("follows the formula in the law: (320 × cm³ + 6.400 × kW) × age coefficient × 2,5%", () => {
    // Golf 1.6 TDI, 1.598 cm³ and 77 kW, twelve years old: coefficient 30%.
    expect(transferTaxRsd(1598, 77, 12)).toBeCloseTo((320 * 1598 + 6400 * 77) * 0.3 * 0.025);
  });

  it("uses the age coefficient for each bracket", () => {
    const base = 320 * 2000 + 6400 * 100;
    expect(transferTaxRsd(2000, 100, 0)).toBeCloseTo(base * 1 * 0.025);
    expect(transferTaxRsd(2000, 100, 2)).toBeCloseTo(base * 0.9 * 0.025);
    expect(transferTaxRsd(2000, 100, 5)).toBeCloseTo(base * 0.6 * 0.025);
    expect(transferTaxRsd(2000, 100, 9)).toBeCloseTo(base * 0.35 * 0.025);
    expect(transferTaxRsd(2000, 100, 25)).toBeCloseTo(base * 0.3 * 0.025);
  });

  it("never rises as a car gets older", () => {
    for (let age = 0; age < 15; age += 1) {
      expect(transferTaxRsd(1600, 80, age + 1)).toBeLessThanOrEqual(transferTaxRsd(1600, 80, age));
    }
  });
});

describe("usageTaxRsd", () => {
  const diesel = (engineCc: number) => ({ engineCc, fuel: "diesel" as const });

  // Each expectation is a cell of the official 2026 table, whose columns are model years.
  it.each([
    [1100, 2024, 1910],
    [1100, 2019, 1623],
    [1250, 2016, 2805],
    [1500, 2012, 4938],
    [1968, 2019, 14356],
    [1968, 2016, 12667],
    [1968, 2010, 10134],
    [1968, 2004, 3378],
    [2200, 2015, 29214],
    [2967, 2019, 126840],
    [3500, 2010, 122346],
  ])("matches the 2026 table for %i cm³ from %i", (engineCc, modelYear, expected) => {
    expect(Math.round(usageTaxRsd(diesel(engineCc), YEAR - modelYear))).toBeCloseTo(expected, -1);
  });

  it("is waived for electric and hybrid cars", () => {
    expect(usageTaxRsd({ engineCc: 1991, fuel: "hybrid" }, 5)).toBe(0);
    expect(usageTaxRsd({ engineCc: 0, fuel: "electric" }, 2)).toBe(0);
  });
});

describe("registrationRsd", () => {
  it("lands on the worked example for a small city car", () => {
    // 1.2 litre, 55 kW, twelve years old: the press puts it at 22.000 to 25.000 RSD.
    const [low, high] = registrationRsd({ engineCc: 1200, powerKw: 55, fuel: "petrol" }, 12);
    expect(low).toBeGreaterThan(20_000);
    expect(high).toBeLessThan(27_000);
  });

  it("gives a range that the no-claims bonus explains", () => {
    const [low, high] = registrationRsd({ engineCc: 1598, powerKw: 77, fuel: "diesel" }, 12);
    expect(low).toBeLessThan(high);
    expect(high - low).toBeLessThan(5000);
  });

  it("makes a three-litre car several times dearer to register than a small one", () => {
    const small = registrationRsd({ engineCc: 1200, powerKw: 55, fuel: "petrol" }, 8)[1];
    const large = registrationRsd({ engineCc: 2979, powerKw: 225, fuel: "petrol" }, 8)[1];
    expect(large).toBeGreaterThan(small * 4);
  });
});

describe("estimateCosts", () => {
  const listing = {
    year: 2014,
    engineCc: 1598,
    powerKw: 77,
    fuel: "diesel",
  } as Listing;
  const dealer = (chargesVat: boolean) => ({ chargesVat }) as Dealer;

  it("charges no transfer tax when the dealer sells with VAT, and shows what it would have been", () => {
    const costs = estimateCosts(listing, dealer(true), YEAR);
    expect(costs.transferTax).toBe(0);
    expect(costs.privateSaleTransferTax).toBe(rsdToEur(transferTaxRsd(1598, 77, 12)));
    expect(costs.privateSaleTransferTax).toBeGreaterThan(0);
  });

  it("charges the transfer tax when the seller does not charge VAT", () => {
    const costs = estimateCosts(listing, dealer(false), YEAR);
    expect(costs.transferTax).toBe(costs.privateSaleTransferTax);
  });

  it("converts the one-off paperwork to euros", () => {
    expect(estimateCosts(listing, dealer(true), YEAR).paperwork).toBe(rsdToEur(PAPERWORK_RSD));
  });
});

describe("dayTotal", () => {
  const costs: CostEstimate = { paperwork: 30, transferTax: 0, privateSaleTransferTax: 65, registration: [300, 330] };

  it("adds the one-off costs to a top-up", () => {
    expect(dayTotal(1900, costs)).toBe(1930);
  });

  it("takes them out of the cash a visitor gets back", () => {
    expect(dayTotal(-3600, costs)).toBe(-3570);
  });
});

describe("rsdToEur", () => {
  it("rounds to the nearest five euros so an estimate does not look exact", () => {
    expect(rsdToEur(3660)).toBe(30);
    expect(rsdToEur(42_000)).toBe(360);
  });
});
