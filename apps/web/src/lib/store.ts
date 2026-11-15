"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_BUDGET, type Direction } from "@/lib/domain/deck";
import type { SwipeDirection, UserCar } from "@/lib/domain/types";

/**
 * Everything the visitor has told us or done, kept on their device. There is
 * no account yet; this moves to the server when login arrives.
 */
interface AppState {
  car: UserCar | null;
  /** Trading up, trading down, or happy with either. */
  direction: Direction;
  /** Most the visitor will add on top of their car, in EUR. */
  budget: number;
  /** When trading down: the least cash back that makes it worth it, in EUR. */
  minCash: number;
  swipes: Record<string, SwipeDirection>;
  /** Listing ids in the order they were swiped, for undo and garage order. */
  history: string[];
  firstMatchSeen: boolean;

  setCar: (car: UserCar | null) => void;
  setDirection: (direction: Direction) => void;
  setBudget: (budget: number) => void;
  setMinCash: (minCash: number) => void;
  swipe: (listingId: string, direction: SwipeDirection) => void;
  /** Takes back the latest swipe and returns its listing id. */
  undo: () => string | null;
  /** Removing a car from the garage means "not this one": it will not be dealt again. */
  removeFromGarage: (listingId: string) => void;
  /** Puts every passed car back in the deck. */
  restorePassed: () => void;
  /** Puts one passed car back in the deck, e.g. when someone sends a link to it. A liked car stays liked. */
  reconsider: (listingId: string) => void;
  markFirstMatchSeen: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      car: null,
      direction: "any",
      budget: DEFAULT_BUDGET,
      minCash: 0,
      swipes: {},
      history: [],
      firstMatchSeen: false,

      setCar: (car) => set({ car }),
      setDirection: (direction) => set({ direction }),
      setBudget: (budget) => set({ budget }),
      setMinCash: (minCash) => set({ minCash }),

      swipe: (listingId, direction) =>
        set((state) => ({
          swipes: { ...state.swipes, [listingId]: direction },
          history: [...state.history.filter((id) => id !== listingId), listingId],
        })),

      undo: () => {
        const { history, swipes } = get();
        const listingId = history.at(-1);
        if (!listingId) return null;
        const rest = { ...swipes };
        delete rest[listingId];
        set({ swipes: rest, history: history.slice(0, -1) });
        return listingId;
      },

      removeFromGarage: (listingId) => set((state) => ({ swipes: { ...state.swipes, [listingId]: "pass" } })),

      restorePassed: () =>
        set((state) => {
          const liked = Object.entries(state.swipes).filter(([, direction]) => direction === "like");
          const keep = new Set(liked.map(([id]) => id));
          return {
            swipes: Object.fromEntries(liked),
            history: state.history.filter((id) => keep.has(id)),
          };
        }),

      reconsider: (listingId) =>
        set((state) => {
          if (state.swipes[listingId] !== "pass") return state;
          const swipes = { ...state.swipes };
          delete swipes[listingId];
          return { swipes, history: state.history.filter((id) => id !== listingId) };
        }),

      markFirstMatchSeen: () => set({ firstMatchSeen: true }),
    }),
    {
      name: "carswap:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ car, direction, budget, minCash, swipes, history, firstMatchSeen }) => ({
        car,
        direction,
        budget,
        minCash,
        swipes,
        history,
        firstMatchSeen,
      }),
    },
  ),
);

/** Liked listing ids, most recent first. */
export function likedIds(state: Pick<AppState, "swipes" | "history">): string[] {
  return state.history.filter((id) => state.swipes[id] === "like").reverse();
}
