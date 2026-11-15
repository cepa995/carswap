import { buildCards, DEFAULT_BUDGET, type DeckCard } from "@/lib/domain/deck";
import { dealShape, type DealShape } from "@/lib/domain/deal";
import { estimateValue } from "@/lib/domain/valuation";
import { EXAMPLE_CAR, REFERENCE_YEAR } from "@/lib/reference";
import { dealers, listings } from "@/lib/seed";

/**
 * The cars and figures the walkthrough on the landing page shows. They are
 * worked out with the estimate and the deal maths the app itself uses, for the
 * same example car as the rest of the page, so the pictures cannot drift from
 * the product.
 */
export const exampleEstimate = estimateValue(EXAMPLE_CAR, REFERENCE_YEAR);

const cards = buildCards({
  listings,
  dealers,
  car: EXAMPLE_CAR,
  estimate: exampleEstimate,
  budget: DEFAULT_BUDGET,
  currentYear: REFERENCE_YEAR,
});

const shapeOf = (card: DeckCard): DealShape | null => (card.deal.status === "swap" ? dealShape(card.deal.topUp) : null);

/** The named car while it still makes that kind of swap; otherwise any car that does. */
function pick(id: string, shape: DealShape): DeckCard {
  const fits = (card: DeckCard) => shapeOf(card) === shape;
  return cards.find((card) => card.listing.id === id && fits(card)) ?? cards.find(fits) ?? cards[0];
}

export const examples = {
  /** A pricier car: the visitor adds money. */
  up: pick("citroen-c4-cactus", "top-up"),
  /** A cheaper car: the visitor leaves with cash. */
  down: pick("fiat-punto", "cash-back"),
  /** As near a straight swap as the stock has. */
  even: pick("renault-clio-4", "even"),
  /** The cards in the deck a visitor can try. The first is also the match shown before they have liked one. */
  deck: [
    pick("toyota-yaris-3", "top-up"),
    pick("ford-fiesta-7", "cash-back"),
    pick("skoda-fabia-3", "top-up"),
    pick("peugeot-208-1", "cash-back"),
  ],
} as const;
