"use client";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { copy } from "@/lib/copy";
import { SwapPreference } from "./SwapPreference";

interface BudgetSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Swaps on offer for the current choice. */
  count: number;
}

/** Trading up, down or either, and how much money is in play. */
export function BudgetSheet({ open, onOpenChange, count }: BudgetSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={copy.pref.title} showTitle>
      <div className="px-5 pt-3 pb-safe">
        <SwapPreference count={count} />
        <Button size="lg" className="mt-5 w-full" onClick={() => onOpenChange(false)}>
          {copy.common.done}
        </Button>
      </div>
    </Sheet>
  );
}
