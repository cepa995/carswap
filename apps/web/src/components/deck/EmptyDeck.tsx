"use client";

import { Layers } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type { Direction, Suggestion } from "@/lib/domain/deck";
import { carsCount, formatEur } from "@/lib/format";
import { springs } from "@/lib/motion";

interface WayOut {
  key: string;
  /** Why it is worth doing: how many more cars it deals. */
  reason: string;
  label: string;
  apply: () => void;
}

interface EmptyDeckProps {
  hasCar: boolean;
  direction: Direction;
  /** The smallest change to the amount that deals more cars. */
  suggestion: Suggestion | null;
  /** How many more cars trading in either direction would deal. */
  otherDirection: number;
  hasPassed: boolean;
  likedCount: number;
  onBudget: (budget: number) => void;
  onMinCash: (minCash: number) => void;
  onAnyDirection: () => void;
  onRestore: () => void;
  onAddCar: () => void;
  className?: string;
}

/** Out of cars: says so, and offers the smallest change that would bring some more. */
export function EmptyDeck({
  hasCar,
  direction,
  suggestion,
  otherDirection,
  hasPassed,
  likedCount,
  onBudget,
  onMinCash,
  onAnyDirection,
  onRestore,
  onAddCar,
  className,
}: EmptyDeckProps) {
  const waysOut: WayOut[] = [];
  if (suggestion?.kind === "raise-budget") {
    const amount = formatEur(suggestion.budget);
    waysOut.push({
      key: "raise",
      reason: copy.deck.emptyRaise(amount, carsCount(suggestion.extra)),
      label: copy.deck.raiseTo(amount),
      apply: () => onBudget(suggestion.budget),
    });
  }
  if (suggestion?.kind === "accept-less-cash") {
    const amount = formatEur(suggestion.minCash);
    const cars = carsCount(suggestion.extra);
    waysOut.push({
      key: "less-cash",
      reason: suggestion.minCash === 0 ? copy.deck.emptyAnyCash(cars) : copy.deck.emptyLessCash(amount, cars),
      label: suggestion.minCash === 0 ? copy.deck.anyCashWillDo : copy.deck.lowerTo(amount),
      apply: () => onMinCash(suggestion.minCash),
    });
  }
  if (otherDirection > 0) {
    const cars = carsCount(otherDirection);
    waysOut.push({
      key: "any-direction",
      reason: direction === "up" ? copy.deck.emptyAlsoCheaper(cars) : copy.deck.emptyAlsoPricier(cars),
      label: direction === "up" ? copy.deck.alsoCheaper : copy.deck.alsoPricier,
      apply: onAnyDirection,
    });
  }

  const body = !hasCar ? copy.deck.emptyBodyNoCar : (waysOut[0]?.reason ?? copy.deck.emptyBodyNoMore);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.settle}
      className={cn(
        "flex h-full flex-col items-center justify-center rounded-card border border-dashed border-line-strong px-7 text-center",
        className,
      )}
    >
      <span className="flex size-16 items-center justify-center rounded-3xl bg-surface text-accent-strong shadow-chip ring-1 ring-line">
        <Layers className="size-8" aria-hidden />
      </span>
      <h2 className="mt-6 font-display text-[1.9rem] leading-none font-bold tracking-tight text-balance">
        {hasCar ? copy.deck.emptyTitleCar : copy.deck.emptyTitleNoCar}
      </h2>
      <p className="mt-3 max-w-xs text-[15px] text-pretty text-fg-muted">{body}</p>

      <div className="mt-7 flex w-full max-w-xs flex-col gap-2.5">
        {!hasCar ? <Button onClick={onAddCar}>{copy.car.add}</Button> : null}
        {waysOut.map((way, index) => (
          <Button key={way.key} variant={index === 0 ? "primary" : "secondary"} onClick={way.apply}>
            {way.label}
          </Button>
        ))}
        {hasPassed ? (
          <Button variant="secondary" onClick={onRestore}>
            {copy.deck.restorePassed}
          </Button>
        ) : null}
        {likedCount > 0 ? (
          <Link
            href="/garage"
            transitionTypes={["nav-forward"]}
            className="rounded-full py-2.5 text-sm font-semibold text-fg-muted hover:text-fg"
          >
            {copy.deck.openGarage}
          </Link>
        ) : null}
      </div>
    </motion.div>
  );
}
