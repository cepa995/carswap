"use client";

import type { KeyboardEvent } from "react";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { BUDGET_MAX, BUDGET_MIN, BUDGET_STEP, MIN_CASH_MAX, MIN_CASH_STEP, type Direction } from "@/lib/domain/deck";
import { carsCount, formatEur } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { useApp } from "@/lib/store";

const OPTIONS: ReadonlyArray<{ value: Direction; label: string; hint: string }> = [
  { value: "up", label: copy.pref.up, hint: copy.pref.upHint },
  { value: "down", label: copy.pref.down, hint: copy.pref.downHint },
  { value: "any", label: copy.pref.any, hint: copy.pref.anyHint },
];

interface SwapPreferenceProps {
  /** Swaps on offer for the current choice. Left out where the caller shows the number itself. */
  count?: number;
  className?: string;
}

/**
 * The one question the whole app turns on: a pricier car and I add money, a
 * cheaper one and I take cash, or whatever is going. One slider follows the
 * answer: the most to add, or the least cash worth taking.
 */
export function SwapPreference({ count, className }: SwapPreferenceProps) {
  const direction = useApp((state) => state.direction);
  const budget = useApp((state) => state.budget);
  const minCash = useApp((state) => state.minCash);
  const setDirection = useApp((state) => state.setDirection);
  const setBudget = useApp((state) => state.setBudget);
  const setMinCash = useApp((state) => state.setMinCash);

  const down = direction === "down";
  const amount = down
    ? minCash === 0
      ? copy.pref.anyCash
      : formatEur(minCash)
    : budget === 0
      ? copy.pref.noTopUp
      : formatEur(budget);

  function choose(next: Direction) {
    if (next === direction) return;
    setDirection(next);
    haptic("tick");
    track("preference_changed", { direction: next, budget, minCash });
  }

  // Arrow keys move the choice and the focus with it, as in a native radio group.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
    if (!forward && !backward) return;
    event.preventDefault();
    const index = OPTIONS.findIndex((option) => option.value === direction);
    const next = OPTIONS[(index + (forward ? 1 : -1) + OPTIONS.length) % OPTIONS.length];
    choose(next.value);
    event.currentTarget.querySelector<HTMLElement>(`[data-value="${next.value}"]`)?.focus();
  }

  return (
    <div className={className}>
      <div
        role="radiogroup"
        aria-label={copy.pref.title}
        onKeyDown={onKeyDown}
        className="grid grid-cols-3 gap-1 rounded-[1.4rem] bg-raised p-1 ring-1 ring-line ring-inset"
      >
        {OPTIONS.map((option) => {
          const selected = option.value === direction;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              data-value={option.value}
              onClick={() => choose(option.value)}
              className={cn(
                "rounded-[1.1rem] px-1 py-2 text-center transition duration-200 ease-out-expo active:scale-[0.97]",
                selected ? "bg-fg text-canvas shadow-chip" : "text-fg hover:bg-hover",
              )}
            >
              <span className="block text-[15px] leading-tight font-semibold">{option.label}</span>
              <span className={cn("block text-[11px] leading-tight", selected ? "text-canvas/75" : "text-fg-faint")}>
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-3 px-1">
        <span className="text-[15px] font-medium text-fg-muted">{down ? copy.pref.getAtLeast : copy.pref.payUpTo}</span>
        <span className="font-display text-[2rem] leading-none font-extrabold tracking-tight tabular-nums">
          {amount}
        </span>
      </div>

      {down ? (
        <RangeSlider
          className="mt-1"
          value={minCash}
          min={0}
          max={MIN_CASH_MAX}
          step={MIN_CASH_STEP}
          onChange={(next) => {
            setMinCash(next);
            track("preference_changed", { direction, budget, minCash: next });
          }}
          label={copy.pref.sliderCash}
          valueText={formatEur(minCash)}
        />
      ) : (
        <RangeSlider
          className="mt-1"
          value={budget}
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          step={BUDGET_STEP}
          onChange={(next) => {
            setBudget(next);
            track("preference_changed", { direction, budget: next, minCash });
          }}
          label={copy.pref.sliderPay}
          valueText={formatEur(budget)}
        />
      )}

      {count === undefined ? null : (
        <p className="flex items-baseline justify-between px-1 text-sm text-fg-muted">
          <span>{copy.pref.inPlay}</span>
          <span className="font-display text-xl font-bold text-fg">{carsCount(count)}</span>
        </p>
      )}
    </div>
  );
}
