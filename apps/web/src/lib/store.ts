"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_BUDGET } from "@/lib/domain/deck";
import type { SwipeDirection, UserCar } from "@/lib/domain/types";

/**
 * Everything the visitor has told us or done, kept on their device. There is
 * no account yet; this moves to the server when login arrives.
 */
interface AppState {
  car: UserCar | null;
  /** Most the visitor will add on top of their car, in EUR. */
  budget: number;
  swipes: Record<string, SwipeDirection>;
  /** Listing ids in the order they were swiped, for undo and garage order. */
  history: string[];
  firstMatchSeen: boolean;

  setCar: (car: UserCar | null) => void;
  setBudget: (budget: number) => void;
  swipe: (listingId: string, direction: SwipeDirection) => void;
  /** Takes back the latest swipe and returns its listing id. */
  undo: () => string | null;
  /** Removing a car from the garage means "not this one": it will not be dealt again. */
  removeFromGarage: (listingId: string) => void;
  /** Puts every passed car back in the deck. */
  restorePassed: () => void;
  markFirstMatchSeen: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      car: null,
      budget: DEFAULT_BUDGET,
      swipes: {},
      history: [],
      firstMatchSeen: false,

      setCar: (car) => set({ car }),
      setBudget: (budget) => set({ budget }),

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

      markFirstMatchSeen: () => set({ firstMatchSeen: true }),
    }),
    {
      name: "carswap:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ car, budget, swipes, history, firstMatchSeen }) => ({
        car,
        budget,
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
