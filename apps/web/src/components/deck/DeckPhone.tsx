"use client";

import { ChevronDown, Plus, SlidersHorizontal } from "lucide-react";
import { motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { BudgetSheet } from "@/components/car/BudgetSheet";
import { GarageLink } from "@/components/garage/GarageLink";
import { Button } from "@/components/ui/Button";
import { CarChip } from "@/components/ui/CarChip";
import { track } from "@/lib/analytics";
import { brand } from "@/lib/brand";
import { copy } from "@/lib/copy";
import { dealLine, describeDeal } from "@/lib/deal-display";
import type { DeckCard } from "@/lib/domain/deck";
import type { SwipeDirection } from "@/lib/domain/types";
import { preferenceLabel } from "@/lib/preference";
import { CarCard } from "./CarCard";
import { DeckControls } from "./DeckControls";
import { DetailsSheet } from "./DetailsSheet";
import { EmptyDeck } from "./EmptyDeck";
import { SwipeDeck, type SwipeDeckHandle, type SwipeMethod } from "./SwipeDeck";
import { Toast } from "./Toast";
import type { DeckSession } from "./useDeckSession";

const cardId = (card: DeckCard) => card.listing.id;
const stamps = { like: copy.deck.stampLike, pass: copy.deck.stampPass };

/**
 * The deck on a phone: one car at a time, filling the screen, thrown right
 * for "menjam" and left for "dalje".
 */
export function DeckPhone({ session }: { session: DeckSession }) {
  const { car, budget, direction, minCash, cards, allCards, canUndo, likedCount, decide, undo } = session;
  const top = cards[0] ?? null;

  const intent = useMotionValue(0);
  const deck = useRef<SwipeDeckHandle>(null);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);

  const details = detailsId ? (allCards.find((card) => card.listing.id === detailsId) ?? null) : null;
  const overlayOpen = detailsId !== null || session.carSheetOpen || budgetSheetOpen || session.match !== null;

  const handleSwipe = useCallback(
    (card: DeckCard, decision: SwipeDirection, method: SwipeMethod) => decide(card, decision, method),
    [decide],
  );

  function openCarSheet(source: "deck" | "details") {
    setDetailsId(null);
    session.openCarSheet(source);
  }

  const openDetails = useCallback((card: DeckCard) => {
    setDetailsId(card.listing.id);
    track("card_details_opened", { listingId: card.listing.id });
  }, []);

  useEffect(() => {
    if (overlayOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      ) {
        return;
      }
      if (event.key === "ArrowLeft") deck.current?.swipe("pass");
      else if (event.key === "ArrowRight") deck.current?.swipe("like");
      else if (event.key === "ArrowUp" && top) openDetails(top);
      else if (event.key === "z" || event.key === "Z") undo();
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [overlayOpen, top, openDetails, undo]);

  return (
    <div className="relative isolate flex h-dvh flex-col overflow-hidden overscroll-none">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 ambient" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 grain opacity-[0.06]" />
      <EdgeGlow intent={intent} />

      <div className="mx-auto flex min-h-0 w-full max-w-[30rem] flex-1 flex-col">
        <header className="box-content flex h-14 shrink-0 items-center justify-between px-5 pt-safe">
          <Link
            href="/"
            transitionTypes={["nav-back"]}
            aria-label={copy.nav.home}
            className="flex items-center gap-2.5"
          >
            <Wordmark />
            {brand.isDemo ? (
              <span className="rounded-full bg-raised px-2 py-0.5 text-[10px] font-semibold tracking-wider text-fg-faint uppercase ring-1 ring-line ring-inset">
                {copy.common.demoBadge}
              </span>
            ) : null}
          </Link>
          <GarageLink count={likedCount} />
        </header>

        <div className="flex shrink-0 items-center gap-2 px-5">
          {car ? (
            <>
              <button
                type="button"
                onClick={() => openCarSheet("deck")}
                aria-label={`${copy.car.yours}: ${car.make} ${car.model}, ${car.year}. ${copy.car.edit}`}
                className="min-w-0 rounded-full transition duration-150 ease-out-expo active:scale-[0.97]"
              >
                <CarChip
                  className="text-[0.95rem]"
                  trailing={<ChevronDown className="-mr-[0.25em] size-[1.05em] shrink-0 text-fg-faint" aria-hidden />}
                >
                  {car.model} · {car.year}
                </CarChip>
              </button>
              <button
                type="button"
                onClick={() => setBudgetSheetOpen(true)}
                className="flex h-8 shrink-0 items-center gap-2 rounded-full bg-surface px-3.5 text-sm font-semibold whitespace-nowrap shadow-chip ring-1 ring-line transition duration-150 ease-out-expo hover:bg-raised active:scale-[0.97]"
              >
                <SlidersHorizontal className="size-4 shrink-0 text-accent-strong" aria-hidden />
                {preferenceLabel({ direction, budget, minCash })}
              </button>
            </>
          ) : (
            <AddCarButton onClick={() => openCarSheet("deck")} />
          )}
        </div>

        <main className="relative min-h-0 flex-1 px-4 pt-6 pb-8 short:pt-4 short:pb-7">
          <div className="mx-auto h-full max-h-[42rem] w-full max-w-[26rem]">
            {cards.length > 0 ? (
              <SwipeDeck
                ref={deck}
                items={cards}
                getId={cardId}
                intent={intent}
                nudge={!canUndo && likedCount === 0}
                stamps={stamps}
                onSwipe={handleSwipe}
                onTap={openDetails}
                renderCard={(card, { isTop }) => <CarCard card={card} car={car} priority={isTop} />}
              />
            ) : (
              <EmptyDeck
                hasCar={car !== null}
                direction={direction}
                suggestion={session.wayOut?.suggestion ?? null}
                otherDirection={session.wayOut?.otherDirection ?? 0}
                hasPassed={session.hasPassed}
                likedCount={likedCount}
                onBudget={session.setBudget}
                onMinCash={session.setMinCash}
                onAnyDirection={() => session.setDirection("any")}
                onRestore={session.restorePassed}
                onAddCar={() => openCarSheet("deck")}
              />
            )}
          </div>
          <Toast message={session.toast} className="absolute inset-x-0 top-16" />
        </main>

        <footer className="shrink-0 px-5 pb-safe">
          <DeckControls
            intent={intent}
            hasCard={top !== null}
            canUndo={canUndo}
            likePulse={session.likePulse}
            onUndo={undo}
            onPass={() => deck.current?.swipe("pass")}
            onLike={() => deck.current?.swipe("like")}
            onDetails={() => top && openDetails(top)}
          />
        </footer>
      </div>

      <p className="sr-only" aria-live="polite">
        {top
          ? `${top.listing.make} ${top.listing.model}, ${top.listing.year}. ${dealLine(describeDeal(top.deal, top.listing), car?.model ?? null)}`
          : ""}
      </p>

      <DetailsSheet
        card={details}
        car={car}
        onClose={() => setDetailsId(null)}
        onAddCar={() => openCarSheet("details")}
        actions={
          <>
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => {
                setDetailsId(null);
                deck.current?.swipe("pass");
              }}
            >
              {copy.deck.pass}
            </Button>
            <Button
              size="lg"
              className="flex-[1.4]"
              onClick={() => {
                setDetailsId(null);
                deck.current?.swipe("like");
              }}
            >
              {copy.deck.like}
            </Button>
          </>
        }
      />

      <BudgetSheet open={budgetSheetOpen} onOpenChange={setBudgetSheetOpen} count={session.inPlay} />
    </div>
  );
}

/** The same shape as the car chip it turns into, in ink so it reads as "to do". */
export function AddCarButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 shrink-0 animate-pulse-ring items-center gap-2 rounded-full bg-fg py-1 pr-4 pl-1 text-sm font-semibold whitespace-nowrap text-canvas transition duration-150 ease-out-expo hover:bg-fg/90 active:scale-[0.97]"
    >
      <span aria-hidden className="flex size-7 items-center justify-center rounded-full bg-accent text-on-accent">
        <Plus className="size-4" strokeWidth={3} />
      </span>
      {copy.car.add}
    </button>
  );
}

/** The screen edges light up in the colour of the decision being made. */
function EdgeGlow({ intent }: { intent: MotionValue<number> }) {
  const like = useTransform(intent, [0, 1], [0, 1]);
  const pass = useTransform(intent, [-1, 0], [1, 0]);
  return (
    <>
      <motion.div
        aria-hidden
        style={{ opacity: like }}
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-2/5 bg-linear-to-l from-accent/30 to-transparent"
      />
      <motion.div
        aria-hidden
        style={{ opacity: pass }}
        className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-2/5 bg-linear-to-r from-pass/12 to-transparent"
      />
    </>
  );
}
