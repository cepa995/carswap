import { computeDeal, type Deal } from "./deal";
import type { Dealer, Estimate, Listing, SwipeDirection, UserCar } from "./types";

export interface DeckCard {
  listing: Listing;
  dealer: Dealer;
  deal: Deal;
}

/** Cars this far above budget still appear, at the end of the deck, flagged. */
export const STRETCH_LIMIT = 2000;

/** For a visitor without a car, stock this many years old or newer is dealt first. */
export const RECENT_STOCK_YEARS = 10;

export const BUDGET_MIN = 0;
export const BUDGET_MAX = 20_000;
export const BUDGET_STEP = 500;
export const DEFAULT_BUDGET = 3000;

export interface DeckInput {
  listings: readonly Listing[];
  dealers: readonly Dealer[];
  car: UserCar | null;
  estimate: Estimate | null;
  budget: number;
  currentYear: number;
}

/** Every listing paired with its dealer and the deal for this visitor. */
export function buildCards(input: DeckInput): DeckCard[] {
  const dealerById = new Map(input.dealers.map((d) => [d.id, d]));
  return input.listings.flatMap((listing) => {
    const dealer = dealerById.get(listing.dealerId);
    if (!dealer) return [];
    const deal = computeDeal(listing, dealer, input.car, input.estimate, input.budget, input.currentYear);
    return [{ listing, dealer, deal }];
  });
}

/**
 * The deck, in the order it is dealt.
 *
 * Without a car every listing is shown, newer stock first: the first few
 * cards decide whether a visitor stays, and there is nothing personal to rank
 * by yet. With a car, swaps that fit the budget come first, followed by near
 * misses ordered by how far over they are. Anything further out, and anything
 * the dealer would not take the car for, is left out.
 *
 * Within each group the order is a stable shuffle, so price points alternate
 * and each swipe is a small surprise.
 *
 * This is a stand-in for the ranking model.
 */
export function buildDeck(input: DeckInput): DeckCard[] {
  const cards = buildCards(input);
  const seed = input.car ? `${input.car.make}/${input.car.model}/${input.car.year}` : "anonymous";

  if (!input.car) {
    const shuffled = stableShuffle(cards, seed);
    const recent = (card: DeckCard) => input.currentYear - card.listing.year <= RECENT_STOCK_YEARS;
    return [...shuffled.filter(recent), ...shuffled.filter((card) => !recent(card))];
  }

  const fits = cards.filter((c) => c.deal.status === "swap");
  const stretch = cards
    .filter((c) => c.deal.status === "over-budget" && c.deal.overBy <= STRETCH_LIMIT)
    .sort((a, b) => overBy(a) - overBy(b));

  return [...stableShuffle(fits, seed), ...stretch];
}

function overBy(card: DeckCard): number {
  return card.deal.status === "over-budget" ? card.deal.overBy : 0;
}

/** How many listings become a swap within budget at each budget level. */
export function countSwaps(input: DeckInput): number {
  return buildCards(input).filter((c) => c.deal.status === "swap").length;
}

/**
 * The smallest budget increase that brings more swaps within reach, or null
 * when raising the budget would not help.
 */
export function nextBudgetStep(input: DeckInput): { budget: number; extra: number } | null {
  const current = countSwaps(input);
  for (let budget = input.budget + BUDGET_STEP; budget <= BUDGET_MAX; budget += BUDGET_STEP) {
    const extra = countSwaps({ ...input, budget }) - current;
    if (extra > 0) return { budget, extra };
  }
  return null;
}

export type SwipeLog = Readonly<Record<string, SwipeDirection>>;

export function remaining(deck: readonly DeckCard[], swipes: SwipeLog): DeckCard[] {
  return deck.filter((card) => !(card.listing.id in swipes));
}

// ── deterministic shuffle ────────────────────────────────────────────────

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Order depends only on the seed and each card's id, so it survives reloads. */
function stableShuffle(cards: DeckCard[], seed: string): DeckCard[] {
  return cards
    .map((card) => ({ card, key: hash(`${seed}:${card.listing.id}`) }))
    .sort((a, b) => a.key - b.key)
    .map((entry) => entry.card);
}
