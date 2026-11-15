import { estimateCosts, type CostEstimate } from "./costs";
import { computeDeal, dealShape, type Deal } from "./deal";
import type { Dealer, Estimate, Listing, SwipeDirection, UserCar } from "./types";

export interface DeckCard {
  listing: Listing;
  dealer: Dealer;
  deal: Deal;
  /** What the swap costs besides the top-up, and a year of registration. */
  costs: CostEstimate;
}

/**
 * Which way the visitor wants to trade. The words are the ones Serbian car ads
 * use: "menjam za skuplje" (I add cash), "menjam za jeftinije" (I get cash).
 */
export type Direction = "any" | "up" | "down";

/** Cars this far above budget still appear, at the end of the deck, flagged. */
export const STRETCH_LIMIT = 2000;

/** For a visitor without a car, stock this many years old or newer is dealt first. */
export const RECENT_STOCK_YEARS = 10;

export const BUDGET_MIN = 0;
export const BUDGET_MAX = 20_000;
export const BUDGET_STEP = 500;
export const DEFAULT_BUDGET = 3000;

export const MIN_CASH_MAX = 10_000;
export const MIN_CASH_STEP = 500;

/** What is needed to work out the deal on each listing. */
export interface DealInput {
  listings: readonly Listing[];
  dealers: readonly Dealer[];
  car: UserCar | null;
  estimate: Estimate | null;
  /** Most the visitor will add on top of their car. */
  budget: number;
  currentYear: number;
}

/** A deal input plus what the visitor is looking for. */
export interface DeckInput extends DealInput {
  direction: Direction;
  /** When trading down: the least cash back that makes it worth it. */
  minCash: number;
  /** A listing to deal first whatever else is true, e.g. one opened from a shared link. */
  pinnedId?: string | null;
}

/** Every listing paired with its dealer, the deal for this visitor and what it costs on top. */
export function buildCards(input: DealInput): DeckCard[] {
  const dealerById = new Map(input.dealers.map((d) => [d.id, d]));
  return input.listings.flatMap((listing) => {
    const dealer = dealerById.get(listing.dealerId);
    if (!dealer) return [];
    const deal = computeDeal(listing, dealer, input.car, input.estimate, input.budget, input.currentYear);
    const costs = estimateCosts(listing, dealer, input.currentYear);
    return [{ listing, dealer, deal, costs }];
  });
}

/** Whether a deal is one the visitor asked to see: a swap the dealer accepts, in the wanted direction. */
export function wanted(deal: Deal, preference: Pick<DeckInput, "direction" | "minCash">): boolean {
  if (deal.status !== "swap") return false;
  const shape = dealShape(deal.topUp);
  if (preference.direction === "up") return shape !== "cash-back";
  if (preference.direction === "down") return shape === "cash-back" && -deal.topUp >= preference.minCash;
  return true;
}

/**
 * The deck, in the order it is dealt.
 *
 * Without a car every listing is shown, newer stock first: the first few
 * cards decide whether a visitor stays, and there is nothing personal to rank
 * by yet. With a car, the swaps the visitor asked for come first. When they
 * are adding money, near misses follow, ordered by how far over budget they
 * are. Anything further out, and anything the dealer would not take the car
 * for, is left out.
 *
 * Within each group the order is a stable shuffle, so price points alternate
 * and each swipe is a small surprise.
 *
 * This is a stand-in for the ranking model.
 */
export function buildDeck(input: DeckInput): DeckCard[] {
  const cards = buildCards(input);
  const seed = input.car ? `${input.car.make}/${input.car.model}/${input.car.year}` : "anonymous";
  return pinFirst(order(cards, input, seed), cards, input.pinnedId);
}

function order(cards: DeckCard[], input: DeckInput, seed: string): DeckCard[] {
  if (!input.car) {
    const shuffled = stableShuffle(cards, seed);
    const recent = (card: DeckCard) => input.currentYear - card.listing.year <= RECENT_STOCK_YEARS;
    return [...shuffled.filter(recent), ...shuffled.filter((card) => !recent(card))];
  }

  const fits = cards.filter((c) => wanted(c.deal, input));
  const stretch =
    input.direction === "down"
      ? []
      : cards
          .filter((c) => c.deal.status === "over-budget" && c.deal.overBy <= STRETCH_LIMIT)
          .sort((a, b) => overBy(a) - overBy(b));

  return [...stableShuffle(fits, seed), ...stretch];
}

function pinFirst(deck: DeckCard[], all: DeckCard[], pinnedId: string | null | undefined): DeckCard[] {
  const pinned = pinnedId ? all.find((card) => card.listing.id === pinnedId) : undefined;
  return pinned ? [pinned, ...deck.filter((card) => card !== pinned)] : deck;
}

function overBy(card: DeckCard): number {
  return card.deal.status === "over-budget" ? card.deal.overBy : 0;
}

/** How many listings are swaps the visitor asked for, leaving out any already swiped. */
export function countSwaps(input: DeckInput, swiped: SwipeLog = {}): number {
  return buildCards(input).filter((c) => wanted(c.deal, input) && !(c.listing.id in swiped)).length;
}

/** Swaps not yet swiped that only appear once the visitor stops insisting on one direction. */
export function otherDirectionCount(input: DeckInput, swiped: SwipeLog = {}): number {
  if (input.direction === "any") return 0;
  return countSwaps({ ...input, direction: "any" }, swiped) - countSwaps(input, swiped);
}

/** A small change to what the visitor asked for that would put more cars in the deck. */
export type Suggestion =
  | { kind: "raise-budget"; budget: number; extra: number }
  | { kind: "accept-less-cash"; minCash: number; extra: number };

/**
 * The smallest loosening that brings more swaps within reach: a higher top-up
 * when adding money, less cash back when trading down. Null when neither helps.
 *
 * Cars already swiped do not count: one seen as a near miss and passed is not
 * a reason to raise the budget.
 */
export function nextSuggestion(input: DeckInput, swiped: SwipeLog = {}): Suggestion | null {
  const current = countSwaps(input, swiped);

  if (input.direction === "down") {
    for (let minCash = input.minCash - MIN_CASH_STEP; minCash >= 0; minCash -= MIN_CASH_STEP) {
      const extra = countSwaps({ ...input, minCash }, swiped) - current;
      if (extra > 0) return { kind: "accept-less-cash", minCash, extra };
    }
    return null;
  }

  for (let budget = input.budget + BUDGET_STEP; budget <= BUDGET_MAX; budget += BUDGET_STEP) {
    const extra = countSwaps({ ...input, budget }, swiped) - current;
    if (extra > 0) return { kind: "raise-budget", budget, extra };
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
