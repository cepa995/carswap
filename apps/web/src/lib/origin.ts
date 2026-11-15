"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Where the app is being served from, e.g. "https://example.rs". Empty while prerendering. */
export function useOrigin(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
}
