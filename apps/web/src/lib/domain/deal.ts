import { roundPrice } from "@/lib/format";
import type { Dealer, Estimate, Listing, UserCar } from "./types";

/**
 * What swapping the visitor's car for a listing would look like.
 *
 * - `no-car`        we do not know what the visitor drives yet
 * - `swap`          the dealer takes the car and the top-up fits the budget
 * - `over-budget`   the dealer takes the car, but the top-up is above budget
 * - `not-accepted`  the dealer's rules exclude the car (too old or too many km)
 */
export type Deal =
  | { status: "no-car" }
  | { status: "not-accepted"; reason: "age" | "km" }
  | {
      status: "swap" | "over-budget";
      /** What the dealer credits for the visitor's car. */
      credit: number;
      /** Listing price minus credit. Negative means the visitor gets cash back. */
      topUp: number;
      /** The credit at the low and high end of the estimate. Always positive, unlike the top-up. */
      creditRange: readonly [number, number];
      /** How far above budget the top-up is; 0 for a swap. */
      overBy: number;
    };

/** Top-ups this close to zero are shown as a straight swap. */
export const EVEN_SWAP_TOLERANCE = 150;

export function computeDeal(
  listing: Listing,
  dealer: Dealer,
  car: UserCar | null,
  estimate: Estimate | null,
  budget: number,
  currentYear: number,
): Deal {
  if (!car || !estimate) return { status: "no-car" };

  const { rules } = dealer;
  if (currentYear - car.year > rules.maxAgeYears) return { status: "not-accepted", reason: "age" };
  if (car.km > rules.maxKm) return { status: "not-accepted", reason: "km" };

  const credit = roundPrice(estimate.mid * rules.creditFactor);
  const topUp = listing.priceEur - credit;
  const creditRange = [
    roundPrice(estimate.low * rules.creditFactor),
    roundPrice(estimate.high * rules.creditFactor),
  ] as const;
  const overBy = Math.max(0, topUp - budget);

  return { status: overBy > 0 ? "over-budget" : "swap", credit, topUp, creditRange, overBy };
}

export type DealShape = "top-up" | "even" | "cash-back";

export function dealShape(topUp: number): DealShape {
  if (Math.abs(topUp) <= EVEN_SWAP_TOLERANCE) return "even";
  return topUp > 0 ? "top-up" : "cash-back";
}
