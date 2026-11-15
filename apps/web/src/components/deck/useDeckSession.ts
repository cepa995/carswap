"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics";
import { useCurrentYear } from "@/lib/clock";
import { copy } from "@/lib/copy";
import { dealLine, describeDeal } from "@/lib/deal-display";
import {
  buildCards,
  buildDeck,
  countSwaps,
  nextSuggestion,
  otherDirectionCount,
  remaining,
  type DeckCard,
  type Direction,
  type Suggestion,
} from "@/lib/domain/deck";
import type { SwipeDirection, UserCar } from "@/lib/domain/types";
import { haptic } from "@/lib/haptics";
import { dealers, listings } from "@/lib/seed";
import { useApp } from "@/lib/store";
import { useEstimate } from "@/lib/useEstimate";
import type { ToastMessage } from "./Toast";

const TOAST_MS = 2200;
/** Wait for the liked card to leave before asking what the visitor drives. */
const ASK_FOR_CAR_DELAY_MS = 500;

/** How a decision was made, for the funnel. */
export type DecisionMethod = "drag" | "button" | "key";

export interface DeckSession {
  car: UserCar | null;
  budget: number;
  direction: Direction;
  minCash: number;

  /** Every listing with its deal, swiped or not. */
  allCards: DeckCard[];
  /** Cars still to be decided, in the order they are offered. */
  cards: DeckCard[];
  /** Liked cars, in the order they were liked. */
  parked: DeckCard[];
  /** Swaps on offer for the current choice, decided or not. */
  inPlay: number;
  /** When nothing is left: what small change would bring more cars. */
  wayOut: { suggestion: Suggestion | null; otherDirection: number } | null;
  likedCount: number;
  hasPassed: boolean;
  canUndo: boolean;

  toast: ToastMessage | null;
  /** Goes up by one with every like. */
  likePulse: number;
  /** The swap being celebrated full screen, the first time one happens. */
  match: DeckCard | null;
  carSheetOpen: boolean;

  /**
   * Records a decision on a car and says what came of it. `celebrateAfterMs`
   * holds the first match's celebration back, for a screen that has something
   * to finish showing first.
   */
  decide: (
    card: DeckCard,
    direction: SwipeDirection,
    method: DecisionMethod,
    options?: { celebrateAfterMs?: number },
  ) => void;
  undo: () => void;
  removeFromGarage: (card: DeckCard) => void;
  setBudget: (budget: number) => void;
  setMinCash: (minCash: number) => void;
  setDirection: (direction: Direction) => void;
  restorePassed: () => void;
  openCarSheet: (source: "deck" | "details") => void;
  setCarSheetOpen: (open: boolean) => void;
  closeMatch: () => void;
  openGarage: () => void;
}

/**
 * Everything the deck screen knows and does, whatever shape it is shown in:
 * a stack to swipe on a phone, a gallery with a garage on a big screen. Both
 * read from one session, so turning a tablet or resizing a window changes
 * the layout and nothing else.
 */
export function useDeckSession(): DeckSession {
  const router = useRouter();
  const currentYear = useCurrentYear();

  const car = useApp((state) => state.car);
  const budget = useApp((state) => state.budget);
  const direction = useApp((state) => state.direction);
  const minCash = useApp((state) => state.minCash);
  const swipes = useApp((state) => state.swipes);
  const history = useApp((state) => state.history);
  const firstMatchSeen = useApp((state) => state.firstMatchSeen);
  const swipe = useApp((state) => state.swipe);
  const undoSwipe = useApp((state) => state.undo);
  const setBudget = useApp((state) => state.setBudget);
  const setMinCash = useApp((state) => state.setMinCash);
  const setDirection = useApp((state) => state.setDirection);
  const restorePassed = useApp((state) => state.restorePassed);
  const removeLiked = useApp((state) => state.removeFromGarage);
  const reconsider = useApp((state) => state.reconsider);
  const markFirstMatchSeen = useApp((state) => state.markFirstMatchSeen);

  // A shared link opens the deck on its car. The id is kept after the address
  // is cleaned up below, so the car stays first until it is decided.
  const sharedId = useSearchParams().get("auto");
  const [pinnedId, setPinnedId] = useState(sharedId);
  if (sharedId && sharedId !== pinnedId) setPinnedId(sharedId);

  useEffect(() => {
    if (!sharedId) return;
    // Somebody thought this car worth sending: show it even if it was passed before.
    reconsider(sharedId);
    track("shared_car_opened", { listingId: sharedId });
    // Without the parameter, a reload does not offer the car again once it has been decided.
    window.history.replaceState(null, "", window.location.pathname);
  }, [sharedId, reconsider]);

  const estimate = useEstimate(car);
  const input = useMemo(() => {
    return { listings, dealers, car, estimate, budget, direction, minCash, currentYear, pinnedId };
  }, [car, estimate, budget, direction, minCash, currentYear, pinnedId]);

  const allCards = useMemo(() => buildCards(input), [input]);
  const cards = useMemo(() => remaining(buildDeck(input), swipes), [input, swipes]);
  const inPlay = useMemo(() => countSwaps(input), [input]);
  const parked = useMemo(() => {
    const byId = new Map(allCards.map((card) => [card.listing.id, card]));
    return history.filter((id) => swipes[id] === "like").flatMap((id) => byId.get(id) ?? []);
  }, [allCards, history, swipes]);

  // Out of cars: work out what small change would bring some more.
  const wayOut = useMemo(() => {
    if (cards.length > 0 || !car) return null;
    return { suggestion: nextSuggestion(input, swipes), otherDirection: otherDirectionCount(input, swipes) };
  }, [cards.length, car, input, swipes]);

  const hasPassed = useMemo(() => Object.values(swipes).some((d) => d === "pass"), [swipes]);

  const [carSheetOpen, setCarSheetOpen] = useState(false);
  const [match, setMatch] = useState<DeckCard | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [askedForCar, setAskedForCar] = useState(false);
  const [likePulse, setLikePulse] = useState(0);
  const [carPromptDue, setCarPromptDue] = useState(false);

  useEffect(() => {
    track("deck_viewed", { cards: cards.length, hasCar: car !== null });
    // Once per visit to the screen, not on every decision.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!carPromptDue) return;
    const timer = window.setTimeout(() => {
      setCarPromptDue(false);
      setCarSheetOpen(true);
      track("car_flow_opened", { source: "deck" });
    }, ASK_FOR_CAR_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [carPromptDue]);

  const decide = useCallback<DeckSession["decide"]>(
    (card, decision, method, options) => {
      const { listing, deal } = card;
      swipe(listing.id, decision);
      haptic("commit");
      track("card_swiped", { listingId: listing.id, direction: decision, dealStatus: deal.status, method });
      if (decision !== "like") return;
      setLikePulse((count) => count + 1);

      const line = dealLine(describeDeal(deal, listing), car?.model ?? null);

      if (deal.status === "swap") {
        haptic("match");
        track("match_shown", { listingId: listing.id, topUp: deal.topUp, first: !firstMatchSeen });
        if (firstMatchSeen) {
          setToast({ key: Date.now(), title: copy.deck.matchToast, detail: line, positive: true });
          return;
        }
        markFirstMatchSeen();
        const wait = options?.celebrateAfterMs ?? 0;
        if (wait > 0) window.setTimeout(() => setMatch(card), wait);
        else setMatch(card);
        return;
      }

      setToast({ key: Date.now(), title: copy.deck.savedToast, positive: false });
      // The first like is the moment the top-up starts to matter.
      if (deal.status === "no-car" && !askedForCar) {
        setAskedForCar(true);
        setCarPromptDue(true);
      }
    },
    [swipe, car, firstMatchSeen, markFirstMatchSeen, askedForCar],
  );

  const undo = useCallback(() => {
    const listingId = undoSwipe();
    if (listingId) track("swipe_undone", { listingId });
  }, [undoSwipe]);

  const removeFromGarage = useCallback(
    (card: DeckCard) => {
      removeLiked(card.listing.id);
      track("garage_item_removed", { listingId: card.listing.id });
    },
    [removeLiked],
  );

  const openCarSheet = useCallback((source: "deck" | "details") => {
    setCarSheetOpen(true);
    track("car_flow_opened", { source });
  }, []);

  const closeMatch = useCallback(() => setMatch(null), []);

  const openGarage = useCallback(() => {
    setMatch(null);
    router.push("/garage", { transitionTypes: ["nav-forward"] });
  }, [router]);

  return {
    car,
    budget,
    direction,
    minCash,
    allCards,
    cards,
    parked,
    inPlay,
    wayOut,
    likedCount: parked.length,
    hasPassed,
    canUndo: history.length > 0,
    toast,
    likePulse,
    match,
    carSheetOpen,
    decide,
    undo,
    removeFromGarage,
    setBudget,
    setMinCash,
    setDirection,
    restorePassed,
    openCarSheet,
    setCarSheetOpen,
    closeMatch,
    openGarage,
  };
}
