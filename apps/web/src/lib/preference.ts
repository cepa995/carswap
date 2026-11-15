import { copy } from "@/lib/copy";
import type { Direction } from "@/lib/domain/deck";
import { formatEur } from "@/lib/format";

export interface Preference {
  direction: Direction;
  budget: number;
  minCash: number;
}

/** What the visitor asked for, short enough for a chip: "Skuplji · do 3.000 €". */
export function preferenceLabel({ direction, budget, minCash }: Preference): string {
  if (direction === "down") {
    return minCash > 0 ? copy.pref.chipDown(formatEur(minCash)) : copy.pref.chipDownAny;
  }
  if (budget === 0) return copy.pref.chipNoTopUp;
  return direction === "up" ? copy.pref.chipUp(formatEur(budget)) : copy.pref.chipAny(formatEur(budget));
}
