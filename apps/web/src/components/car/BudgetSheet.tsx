"use client";

import { Button } from "@/components/ui/Button";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { BUDGET_MAX, BUDGET_MIN, BUDGET_STEP } from "@/lib/domain/deck";
import { carsCount, formatEur } from "@/lib/format";

const PRESETS = [0, 1000, 3000, 5000, 10_000];

interface BudgetSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: number;
  onBudget: (budget: number) => void;
  /** Swaps that fit the budget currently shown. */
  inBudget: number;
}

export function BudgetSheet({ open, onOpenChange, budget, onBudget, inBudget }: BudgetSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={copy.budget.title} showTitle>
      <div className="px-6 pb-safe">
        <p className="text-sm text-fg-muted">{copy.budget.subtitle}</p>

        <p className="mt-6 font-display text-6xl leading-none font-extrabold tracking-tight tabular-nums">
          {budget === 0 ? <span className="text-[2.6rem]">{copy.budget.evenSwap}</span> : formatEur(budget)}
        </p>

        <RangeSlider
          className="mt-4"
          value={budget}
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          step={BUDGET_STEP}
          onChange={onBudget}
          label={copy.budget.sliderLabel}
          valueText={formatEur(budget)}
        />

        <div className="-mx-6 mt-2 no-scrollbar flex gap-2 overflow-x-auto px-6">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onBudget(preset)}
              className={cn(
                "h-10 shrink-0 rounded-full px-4 text-sm font-semibold ring-1 transition duration-150 ease-out-expo ring-inset active:scale-[0.97]",
                preset === budget ? "bg-fg text-canvas ring-fg" : "bg-raised text-fg ring-line hover:bg-hover",
              )}
            >
              {preset === 0 ? copy.budget.evenSwap : formatEur(preset)}
            </button>
          ))}
        </div>

        <p className="mt-6 flex items-baseline justify-between text-sm text-fg-muted">
          <span>{copy.budget.inBudget}</span>
          <span className="font-display text-xl font-bold text-fg">{carsCount(inBudget)}</span>
        </p>

        <Button size="lg" className="mt-4 w-full" onClick={() => onOpenChange(false)}>
          {copy.common.done}
        </Button>
      </div>
    </Sheet>
  );
}
