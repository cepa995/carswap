"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False on the server and while React is attaching to the server's HTML, true
 * from then on. For anything that should only start once the page is live,
 * without the server and the browser disagreeing about the first render.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
