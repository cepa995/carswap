import type { Deal } from "@/lib/domain/deal";
import type { SwipeDirection } from "@/lib/domain/types";

/**
 * One event per funnel step. UI code calls `track()`; where events go is
 * decided by the transport, so adding a provider does not touch the UI.
 */
export interface AnalyticsEvents {
  landing_viewed: Record<string, never>;
  /** A card in the landing page's "try it" deck was swiped. */
  landing_demo_swiped: { listingId: string; direction: SwipeDirection };
  car_flow_opened: { source: "landing" | "deck" | "details" | "garage" };
  car_saved: { make: string; model: string; year: number };
  preference_changed: { direction: "any" | "up" | "down"; budget: number; minCash: number };
  deck_viewed: { cards: number; hasCar: boolean };
  card_swiped: {
    listingId: string;
    direction: SwipeDirection;
    dealStatus: Deal["status"];
    method: "drag" | "button" | "key";
  };
  card_details_opened: { listingId: string };
  swipe_undone: { listingId: string };
  match_shown: { listingId: string; topUp: number; first: boolean };
  share_opened: { listingId: string; source: "details" | "match"; withSwap: boolean };
  share_sent: { listingId: string; channel: "viber" | "whatsapp" | "copy" | "native"; withSwap: boolean };
  /** The deck was opened from a shared link, with that car dealt first. */
  shared_car_opened: { listingId: string };
  garage_viewed: { saved: number };
  garage_item_removed: { listingId: string };
}

export type AnalyticsEvent = keyof AnalyticsEvents;

type Transport = <E extends AnalyticsEvent>(event: E, properties: AnalyticsEvents[E]) => void;

const consoleTransport: Transport = (event, properties) => {
  console.debug(`[analytics] ${event}`, properties);
};

// No provider yet: events are only logged during development.
let transport: Transport | null = process.env.NODE_ENV === "development" ? consoleTransport : null;

export function setAnalyticsTransport(next: Transport | null): void {
  transport = next;
}

export function track<E extends AnalyticsEvent>(event: E, properties: AnalyticsEvents[E]): void {
  transport?.(event, properties);
}
