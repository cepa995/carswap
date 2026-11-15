"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Whether a CSS media query matches, kept up to date. False on the server. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Tailwind's `lg`: from here up there is room for more than one column of app. */
export const DESKTOP = "(min-width: 64rem)";

/**
 * A screen with room for the desktop layouts: a gallery instead of a deck,
 * dialogs instead of bottom sheets. It is about width, not about the device:
 * a tablet on its side counts, a narrow browser window does not.
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP);
}
