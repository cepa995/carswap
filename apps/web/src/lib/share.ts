import { copy } from "@/lib/copy";
import { dealShape, EVEN_SWAP_TOLERANCE, type Deal } from "@/lib/domain/deal";
import type { Listing } from "@/lib/domain/types";
import { formatEur } from "@/lib/format";
import { catalog } from "@/lib/seed/catalog";

/**
 * A shared link carries the sender's side of the swap in its path, so the
 * link itself tells the story even before a preview loads:
 *
 *   /auto/skoda-octavia-3/golf/doplata-2400    Golf + 2.400 € = Škoda Octavia
 *   /auto/fiat-punto/golf/kes-3600             Golf = Fiat Punto + 3.600 € keša
 *   /auto/opel-astra-j/golf/kljuc-za-kljuc     Golf = Opel Astra, ključ za ključ
 *
 * Only the model and the amount travel. Anyone can type such a path, so it is
 * read back strictly: see `parseSwap`.
 */
export interface SharedSwap {
  /** The sender's car model, spelled as in the catalogue. */
  model: string;
  /** What the sender adds; negative when they get cash back, zero for a straight swap. */
  topUp: number;
}

const TOP_UP = "doplata";
const CASH = "kes";
const EVEN = "kljuc-za-kljuc";

const AMOUNT_STEP = 50;
const AMOUNT_MAX = 100_000;
/** No dealer credits a used car at more than about what the model costs new. */
const MAX_CREDIT_OF_NEW_PRICE = 1.25;

/** "Škoda Octavia" → "skoda-octavia" */
export function slugify(text: string): string {
  return text
    .replace(/[đĐ]/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const modelBySlug = new Map(
  catalog.flatMap((make) => make.models).map((model) => [slugify(model.name), model] as const),
);

/** The swap worth putting in a link: one the dealer would do, for a car we know. */
export function swapToShare(deal: Deal, carModel: string | null): SharedSwap | null {
  if (!carModel || !modelBySlug.has(slugify(carModel))) return null;
  if (deal.status !== "swap" && deal.status !== "over-budget") return null;
  return { model: carModel, topUp: dealShape(deal.topUp) === "even" ? 0 : deal.topUp };
}

export function swapSegments(swap: SharedSwap): { car: string; deal: string } {
  const shape = dealShape(swap.topUp);
  const deal = shape === "even" ? EVEN : shape === "top-up" ? `${TOP_UP}-${swap.topUp}` : `${CASH}-${-swap.topUp}`;
  return { car: slugify(swap.model), deal };
}

export function sharePath(listingId: string, swap: SharedSwap | null): string {
  if (!swap) return `/auto/${listingId}`;
  const { car, deal } = swapSegments(swap);
  return `/auto/${listingId}/${car}/${deal}`;
}

/** The deck with this listing dealt first. */
export function deckPath(listingId: string): string {
  return `/swipe?auto=${encodeURIComponent(listingId)}`;
}

function parseAmount(deal: string): number | null {
  if (deal === EVEN) return 0;
  // No leading zeros and no other spelling, so one swap has exactly one address.
  const match = /^(doplata|kes)-([1-9]\d{2,5})$/.exec(deal);
  if (!match) return null;
  const amount = Number(match[2]);
  if (amount > AMOUNT_MAX || amount % AMOUNT_STEP !== 0 || amount <= EVEN_SWAP_TOLERANCE) return null;
  return match[1] === TOP_UP ? amount : -amount;
}

/**
 * Reads the swap back out of a link, or returns null.
 *
 * The page and its preview image print these numbers under our name, so a
 * made-up link must not be able to promise a swap no dealer would do. The
 * model has to be in the catalogue, and the credit the numbers imply for it
 * has to be something that model could be worth.
 */
export function parseSwap(car: string, deal: string, listing: Pick<Listing, "priceEur">): SharedSwap | null {
  const model = modelBySlug.get(car);
  const topUp = parseAmount(deal);
  if (!model || topUp === null) return null;

  const impliedCredit = listing.priceEur - topUp;
  if (impliedCredit <= 0 || impliedCredit > model.base * MAX_CREDIT_OF_NEW_PRICE) return null;

  return { model: model.name, topUp };
}

/**
 * The swap as one line, in whichever shape it has. Both car names stay in the
 * nominative, so nothing needs a case ending.
 */
export function equationLine(swap: SharedSwap, listingName: string): string {
  const shape = dealShape(swap.topUp);
  if (shape === "top-up") return `${swap.model} + ${formatEur(swap.topUp)} = ${listingName}`;
  if (shape === "cash-back") return `${swap.model} = ${listingName} + ${formatEur(-swap.topUp)} ${copy.share.cash}`;
  return `${swap.model} = ${listingName}, ${copy.share.even}`;
}

export function listingName(listing: Pick<Listing, "make" | "model">): string {
  return `${listing.make} ${listing.model}`;
}

/** The headline of a shared link: the equation, or the car and its price when there is no swap to show. */
export function shareHeadline(listing: Listing, swap: SharedSwap | null): string {
  const name = listingName(listing);
  return swap ? equationLine(swap, name) : `${name}, ${listing.year}, ${formatEur(listing.priceEur)}`;
}

/** What lands in the chat, link included. Plain spaces only: some apps mangle a non-breaking one. */
export function shareMessage(listing: Listing, swap: SharedSwap | null, url: string): string {
  return `${shareHeadline(listing, swap)}. ${copy.share.look} ${url}`.replace(/ /g, " ");
}

export function viberLink(message: string): string {
  return `viber://forward?text=${encodeURIComponent(message)}`;
}

export function whatsappLink(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
