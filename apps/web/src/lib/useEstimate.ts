"use client";

import { useMemo } from "react";
import { useCurrentYear } from "@/lib/clock";
import type { Estimate, UserCar } from "@/lib/domain/types";
import { estimateValue } from "@/lib/domain/valuation";

/**
 * The estimated value of a car, or null when there is no car.
 *
 * Every screen gets its estimate here, so pointing the app at the valuation
 * service means changing this hook and nothing else.
 */
export function useEstimate(car: UserCar | null): Estimate | null {
  const currentYear = useCurrentYear();
  return useMemo(() => (car ? estimateValue(car, currentYear) : null), [car, currentYear]);
}
