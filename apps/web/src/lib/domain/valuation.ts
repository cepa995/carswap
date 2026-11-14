import { findBasePrice } from "@/lib/seed/catalog";
import { roundPrice } from "@/lib/format";
import type { Estimate, Fuel, UserCar } from "./types";

/**
 * PLACEHOLDER ESTIMATE.
 *
 * A transparent depreciation curve, not a model. It exists so the swipe deck
 * can show "your car + X" before the real valuation service does. It is the
 * only place that turns a car into a value, so swapping it for the API is a
 * change to this one function.
 *
 * The curve is calibrated by eye against asking prices in Serbia, where used
 * cars hold their value longer than in western Europe.
 */

/** Share of the new price a car still fetches at a given age, [years, share]. */
const RETENTION: ReadonlyArray<readonly [number, number]> = [
  [0, 0.95],
  [1, 0.85],
  [3, 0.72],
  [6, 0.58],
  [10, 0.4],
  [12, 0.33],
  [15, 0.25],
  [20, 0.15],
  [25, 0.09],
  [30, 0.06],
  [40, 0.04],
];

const KM_PER_YEAR = 14_000;
/** Value change per 100.000 km above or below what is typical for the age. */
const KM_SENSITIVITY = 0.12;
const KM_ADJUST_MIN = 0.78;
const KM_ADJUST_MAX = 1.12;

const FUEL_ADJUST: Record<Fuel, number> = {
  petrol: 1,
  diesel: 1.03,
  lpg: 0.96,
  hybrid: 1.06,
  electric: 1,
};

const MIN_VALUE = 400;

export function retentionAt(ageYears: number): number {
  const age = Math.max(0, ageYears);
  const last = RETENTION[RETENTION.length - 1];
  if (age >= last[0]) return last[1];
  for (let i = 1; i < RETENTION.length; i += 1) {
    const [x1, y1] = RETENTION[i];
    if (age <= x1) {
      const [x0, y0] = RETENTION[i - 1];
      return y0 + ((age - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return last[1];
}

/** Mileage a car of this age typically has. Also the picker's default. */
export function typicalKm(ageYears: number): number {
  return Math.max(0, Math.min(ageYears, 25)) * KM_PER_YEAR;
}

export function estimateValue(car: UserCar, currentYear: number): Estimate {
  const age = Math.max(0, currentYear - car.year);
  const base = findBasePrice(car.make, car.model);

  const kmDelta = (car.km - typicalKm(age)) / 100_000;
  const kmAdjust = Math.min(KM_ADJUST_MAX, Math.max(KM_ADJUST_MIN, 1 - KM_SENSITIVITY * kmDelta));

  const mid = Math.max(MIN_VALUE, base * retentionAt(age) * kmAdjust * FUEL_ADJUST[car.fuel]);

  // Older cars vary more in condition, so the range widens with age.
  const spread = Math.min(0.16, 0.07 + 0.004 * age);

  return {
    low: roundPrice(mid * (1 - spread)),
    mid: roundPrice(mid),
    high: roundPrice(mid * (1 + spread)),
  };
}
