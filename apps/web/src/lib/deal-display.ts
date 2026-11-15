import { copy } from "@/lib/copy";
import { dealShape, type Deal } from "@/lib/domain/deal";
import type { Listing } from "@/lib/domain/types";
import { formatEur } from "@/lib/format";

/**
 * How a deal reads on screen. One place decides the wording and emphasis, so
 * the card, the details sheet, the garage and the match moment always agree.
 */
export interface DealDisplay {
  /**
   * - `price`      no swap maths to show, only the asking price
   * - `top-up`     the visitor adds money to their car
   * - `even`       a straight swap
   * - `cash-back`  the listing is cheaper; the visitor keeps the difference
   */
  kind: "price" | "top-up" | "even" | "cash-back";
  /** The headline figure, already formatted. */
  value: string;
  flag: { tone: "ok" | "warn" | "muted"; text: string } | null;
}

export function describeDeal(deal: Deal, listing: Listing): DealDisplay {
  if (deal.status === "no-car") {
    return { kind: "price", value: formatEur(listing.priceEur), flag: null };
  }
  if (deal.status === "not-accepted") {
    return {
      kind: "price",
      value: formatEur(listing.priceEur),
      flag: { tone: "muted", text: copy.deal.noTradeIn },
    };
  }

  const shape = dealShape(deal.topUp);
  const inBudget = deal.status === "swap";
  const flag: DealDisplay["flag"] = inBudget
    ? { tone: "ok", text: copy.deal.canSwap }
    : { tone: "warn", text: copy.deal.overBudget(formatEur(deal.overBy)) };

  if (shape === "even") return { kind: "even", value: copy.deal.evenValue, flag };
  if (shape === "cash-back") {
    return { kind: "cash-back", value: formatEur(-deal.topUp), flag };
  }
  return { kind: "top-up", value: formatEur(deal.topUp), flag };
}

/**
 * Text colour for the headline figure on paper. A swap that fits the budget is
 * the one number printed in red, the way a shop marks its offer price; one
 * that is over budget steps back.
 */
export function dealTone(display: DealDisplay): string {
  if (display.flag?.tone === "ok") return "text-accent-strong";
  if (display.flag?.tone === "warn") return "text-fg-muted";
  return "text-fg";
}

/** One line for lists and announcements: "Golf + 2.400 €". */
export function dealLine(display: DealDisplay, carModel: string | null): string {
  if (display.kind === "price" || !carModel) return display.value;
  if (display.kind === "even") return `${carModel} · ${display.value}`;
  if (display.kind === "cash-back") return `${carModel} ${copy.deal.cashBackSuffix} ${display.value}`;
  return `${carModel} + ${display.value}`;
}
