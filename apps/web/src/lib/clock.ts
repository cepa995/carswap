"use client";

import { useSyncExternalStore } from "react";
import { REFERENCE_YEAR } from "@/lib/reference";

const subscribe = () => () => {};
const browserYear = () => new Date().getFullYear();
const serverYear = () => REFERENCE_YEAR;

/** The current year in the browser; the reference year while prerendering. */
export function useCurrentYear(): number {
  return useSyncExternalStore(subscribe, browserYear, serverYear);
}
