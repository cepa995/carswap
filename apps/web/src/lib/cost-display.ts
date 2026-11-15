import { dayTotal, type CostEstimate } from "@/lib/domain/costs";
import { dealShape, type Deal } from "@/lib/domain/deal";
import { formatEur, formatInt } from "@/lib/format";

/**
 * What changes hands on the day with tax and paperwork included: either the
 * visitor pays it, or it is what they walk away with. Null when there is no
 * swap to add the costs to.
 */
export function allIn(deal: Deal, costs: CostEstimate): { receives: boolean; amount: number } | null {
  if (deal.status !== "swap" && deal.status !== "over-budget") return null;
  // A swap shown as "ključ za ključ" hides a difference too small to matter; it stays hidden here too.
  const topUp = dealShape(deal.topUp) === "even" ? 0 : deal.topUp;
  const total = dayTotal(topUp, costs);
  return { receives: total < 0, amount: Math.abs(total) };
}

/** One figure for a year of registration: the middle of the range, to the nearest ten. */
export function typicalRegistration(costs: CostEstimate): number {
  const [low, high] = costs.registration;
  return Math.round((low + high) / 2 / 10) * 10;
}

/** "250–270 €", or a single figure when the two ends round to the same amount. */
export function registrationRange(costs: CostEstimate): string {
  const [low, high] = costs.registration;
  return low === high ? formatEur(low) : `${formatInt(low)}–${formatEur(high)}`;
}
