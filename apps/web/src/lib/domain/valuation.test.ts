import { describe, expect, it } from "vitest";
import type { UserCar } from "./types";
import { estimateValue, retentionAt, typicalKm } from "./valuation";

const YEAR = 2026;
const golf: UserCar = { make: "Volkswagen", model: "Golf", year: 2011, km: 205_000, fuel: "diesel" };

describe("retentionAt", () => {
  it("never rises with age", () => {
    for (let age = 0; age < 45; age += 1) {
      expect(retentionAt(age + 1)).toBeLessThanOrEqual(retentionAt(age));
    }
  });

  it("interpolates between the calibration points", () => {
    expect(retentionAt(10)).toBeCloseTo(0.4);
    expect(retentionAt(11)).toBeCloseTo(0.365);
    expect(retentionAt(100)).toBeCloseTo(0.04);
  });
});

describe("estimateValue", () => {
  it("returns an ordered range around the mid estimate", () => {
    const estimate = estimateValue(golf, YEAR);
    expect(estimate.low).toBeLessThan(estimate.mid);
    expect(estimate.mid).toBeLessThan(estimate.high);
  });

  it("puts a 2011 Golf where the Serbian market does", () => {
    const { mid } = estimateValue(golf, YEAR);
    expect(mid).toBeGreaterThan(6000);
    expect(mid).toBeLessThan(9000);
  });

  it("never values an older car higher, all else equal", () => {
    for (let year = 2025; year > 1996; year -= 1) {
      const newer = estimateValue({ ...golf, year }, YEAR).mid;
      const older = estimateValue({ ...golf, year: year - 1 }, YEAR).mid;
      expect(older).toBeLessThanOrEqual(newer);
    }
  });

  it("never values a higher-mileage car higher, all else equal", () => {
    for (let km = 0; km < 400_000; km += 20_000) {
      const fewer = estimateValue({ ...golf, km }, YEAR).mid;
      const more = estimateValue({ ...golf, km: km + 20_000 }, YEAR).mid;
      expect(more).toBeLessThanOrEqual(fewer);
    }
  });

  it("widens the range for older cars", () => {
    const spread = (car: UserCar) => {
      const { low, mid, high } = estimateValue(car, YEAR);
      return (high - low) / mid;
    };
    expect(spread({ ...golf, year: 2004 })).toBeGreaterThan(spread({ ...golf, year: 2022 }));
  });

  it("falls back to a generic price for a car that is not in the catalogue", () => {
    const estimate = estimateValue({ ...golf, make: "Nepoznat", model: "Model" }, YEAR);
    expect(estimate.mid).toBeGreaterThan(0);
  });

  it("keeps a floor under very old cars", () => {
    const yugo: UserCar = { make: "Zastava", model: "Yugo", year: 1996, km: 380_000, fuel: "petrol" };
    expect(estimateValue(yugo, YEAR).mid).toBeGreaterThanOrEqual(400);
  });
});

describe("typicalKm", () => {
  it("grows with age and levels off for very old cars", () => {
    expect(typicalKm(0)).toBe(0);
    expect(typicalKm(10)).toBe(140_000);
    expect(typicalKm(40)).toBe(typicalKm(25));
  });
});
