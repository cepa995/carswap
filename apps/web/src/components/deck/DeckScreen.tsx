"use client";

import { ChevronDown, Layers, Plus, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { browser } from "react-dom";
import { Wordmark } from "@/components/brand/Wordmark";
import { BudgetSheet } from "@/components/car/BudgetSheet";
import { MyCarSheet } from "@/components/car/MyCarSheet";
import { GarageLink } from "@/components/garage/GarageLink";
import { Button } from "@/components/ui/Button";
import { CarChip } from "@/components/ui/CarChip";
import { track } from "@/lib/analytics";
import { brand } from "@/lib/brand";
import { useCurrentYear } from "@/lib/clock";
import { copy } from "@/lib/copy";
import { dealLine, describeDeal } from "@/lib/deal-display";
import {
  buildCards,
  buildDeck,
  countSwaps,
  nextSuggestion,
  otherDirectionCount,
  remaining,
  type DeckCard,
  type Direction,
  type Suggestion,
} from "@/lib/domain/deck";
import type { SwipeDirection } from "@/lib/domain/types";
import { carsCount, formatEur } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { springs } from "@/lib/motion";
import { preferenceLabel } from "@/lib/preference";
import { dealers, listings } from "@/lib/seed";
import { useApp } from "@/lib/store";
import { useEstimate } from "@/lib/useEstimate";
import { CarCard } from "./CarCard";
import { DeckControls } from "./DeckControls";
import { DetailsSheet } from "./DetailsSheet";
import { MatchMoment } from "./MatchMoment";
import { SwipeDeck, type SwipeDeckHandle, type SwipeMethod } from "./SwipeDeck";

const TOAST_MS = 2200;
/** Wait for the liked card to leave before asking what the visitor drives. */
const ASK_FOR_CAR_DELAY_MS = 500;

const cardId = (card: DeckCard) => card.listing.id;
const stamps = { like: copy.deck.stampLike, pass: copy.deck.stampPass };

interface ToastMessage {
  key: number;
  title: string;
  detail?: string;
  positive: boolean;
}

export function DeckScreen() {
  // Everything here depends on the car, budget and swipes kept on the device,
  // so there is nothing truthful to render on the server.
  use(browser("The deck is built from state stored in localStorage."));

  const router = useRouter();
  const currentYear = useCurrentYear();

  const car = useApp((state) => state.car);
  const budget = useApp((state) => state.budget);
  const direction = useApp((state) => state.direction);
  const minCash = useApp((state) => state.minCash);
  const swipes = useApp((state) => state.swipes);
  const canUndo = useApp((state) => state.history.length > 0);
  const firstMatchSeen = useApp((state) => state.firstMatchSeen);
  const swipe = useApp((state) => state.swipe);
  const undo = useApp((state) => state.undo);
  const setBudget = useApp((state) => state.setBudget);
  const setMinCash = useApp((state) => state.setMinCash);
  const setDirection = useApp((state) => state.setDirection);
  const restorePassed = useApp((state) => state.restorePassed);
  const reconsider = useApp((state) => state.reconsider);
  const markFirstMatchSeen = useApp((state) => state.markFirstMatchSeen);

  // A shared link opens the deck on its car. The id is kept after the address
  // is cleaned up below, so the car stays on top until it is swiped.
  const sharedId = useSearchParams().get("auto");
  const [pinnedId, setPinnedId] = useState(sharedId);
  if (sharedId && sharedId !== pinnedId) setPinnedId(sharedId);

  useEffect(() => {
    if (!sharedId) return;
    // Somebody thought this car worth sending: show it even if it was passed before.
    reconsider(sharedId);
    track("shared_car_opened", { listingId: sharedId });
    // Without the parameter, a reload does not deal the car again once it has been swiped.
    window.history.replaceState(null, "", window.location.pathname);
  }, [sharedId, reconsider]);

  const estimate = useEstimate(car);
  const input = useMemo(() => {
    return { listings, dealers, car, estimate, budget, direction, minCash, currentYear, pinnedId };
  }, [car, estimate, budget, direction, minCash, currentYear, pinnedId]);

  const allCards = useMemo(() => buildCards(input), [input]);
  const cards = useMemo(() => remaining(buildDeck(input), swipes), [input, swipes]);
  const inPlay = useMemo(() => countSwaps(input), [input]);

  // Out of cards: work out what small change would deal some more.
  const wayOut = useMemo(() => {
    if (cards.length > 0 || !car) return null;
    return { suggestion: nextSuggestion(input, swipes), otherDirection: otherDirectionCount(input, swipes) };
  }, [cards.length, car, input, swipes]);

  const likedCount = useMemo(() => Object.values(swipes).filter((d) => d === "like").length, [swipes]);
  const hasPassed = useMemo(() => Object.values(swipes).some((d) => d === "pass"), [swipes]);
  const top = cards[0] ?? null;

  const intent = useMotionValue(0);
  const deck = useRef<SwipeDeckHandle>(null);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [carSheetOpen, setCarSheetOpen] = useState(false);
  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);
  const [match, setMatch] = useState<DeckCard | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [askedForCar, setAskedForCar] = useState(false);
  const [likePulse, setLikePulse] = useState(0);
  const [carPromptDue, setCarPromptDue] = useState(false);

  const details = detailsId ? (allCards.find((card) => card.listing.id === detailsId) ?? null) : null;
  const overlayOpen = detailsId !== null || carSheetOpen || budgetSheetOpen || match !== null;

  useEffect(() => {
    track("deck_viewed", { cards: cards.length, hasCar: car !== null });
    // Once per visit to the screen, not on every swipe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!carPromptDue) return;
    const timer = window.setTimeout(() => {
      setCarPromptDue(false);
      setCarSheetOpen(true);
      track("car_flow_opened", { source: "deck" });
    }, ASK_FOR_CAR_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [carPromptDue]);

  const handleSwipe = useCallback(
    (card: DeckCard, direction: SwipeDirection, method: SwipeMethod) => {
      const { listing, deal } = card;
      swipe(listing.id, direction);
      haptic("commit");
      track("card_swiped", { listingId: listing.id, direction, dealStatus: deal.status, method });
      if (direction !== "like") return;
      setLikePulse((count) => count + 1);

      const line = dealLine(describeDeal(deal, listing), car?.model ?? null);

      if (deal.status === "swap") {
        haptic("match");
        track("match_shown", { listingId: listing.id, topUp: deal.topUp, first: !firstMatchSeen });
        if (!firstMatchSeen) {
          markFirstMatchSeen();
          setMatch(card);
        } else {
          setToast({ key: Date.now(), title: copy.deck.matchToast, detail: line, positive: true });
        }
        return;
      }

      setToast({ key: Date.now(), title: copy.deck.savedToast, positive: false });
      // The first like is the moment the top-up starts to matter.
      if (deal.status === "no-car" && !askedForCar) {
        setAskedForCar(true);
        setCarPromptDue(true);
      }
    },
    [swipe, car, firstMatchSeen, markFirstMatchSeen, askedForCar],
  );

  const handleUndo = useCallback(() => {
    const listingId = undo();
    if (listingId) track("swipe_undone", { listingId });
  }, [undo]);

  const openCarSheet = useCallback((source: "deck" | "details") => {
    setDetailsId(null);
    setCarSheetOpen(true);
    track("car_flow_opened", { source });
  }, []);

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
      else if (event.key === "z" || event.key === "Z") handleUndo();
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [overlayOpen, top, openDetails, handleUndo]);

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
            // The same shape as the car chip it turns into, in ink so it reads as "to do".
            <button
              type="button"
              onClick={() => openCarSheet("deck")}
              className="flex h-9 animate-pulse-ring items-center gap-2 rounded-full bg-fg py-1 pr-4 pl-1 text-sm font-semibold text-canvas transition duration-150 ease-out-expo hover:bg-fg/90 active:scale-[0.97]"
            >
              <span
                aria-hidden
                className="flex size-7 items-center justify-center rounded-full bg-accent text-on-accent"
              >
                <Plus className="size-4" strokeWidth={3} />
              </span>
              {copy.car.add}
            </button>
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
                suggestion={wayOut?.suggestion ?? null}
                otherDirection={wayOut?.otherDirection ?? 0}
                hasPassed={hasPassed}
                likedCount={likedCount}
                onBudget={setBudget}
                onMinCash={setMinCash}
                onAnyDirection={() => setDirection("any")}
                onRestore={restorePassed}
                onAddCar={() => openCarSheet("deck")}
              />
            )}
          </div>
          <Toast message={toast} />
        </main>

        <footer className="shrink-0 px-5 pb-safe">
          <DeckControls
            intent={intent}
            hasCard={top !== null}
            canUndo={canUndo}
            likePulse={likePulse}
            onUndo={handleUndo}
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

      <MyCarSheet open={carSheetOpen} onOpenChange={setCarSheetOpen} />

      <BudgetSheet open={budgetSheetOpen} onOpenChange={setBudgetSheetOpen} count={inPlay} />

      <MatchMoment
        card={match}
        car={car}
        onContinue={() => setMatch(null)}
        onOpenGarage={() => {
          setMatch(null);
          router.push("/garage", { transitionTypes: ["nav-forward"] });
        }}
      />
    </div>
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

function Toast({ message }: { message: ToastMessage | null }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-40 flex justify-center px-6" role="status">
      <AnimatePresence mode="popLayout">
        {message ? (
          <motion.div
            key={message.key}
            initial={{ y: -18, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -12, opacity: 0, scale: 0.96 }}
            transition={springs.snappy}
            className={
              message.positive
                ? "flex max-w-full items-center gap-2.5 rounded-full bg-accent py-2 pr-4 pl-3 text-sm font-semibold text-on-accent shadow-accent"
                : "flex max-w-full items-center gap-2 rounded-full bg-canvas/90 px-4 py-2 text-sm font-semibold dark-surface shadow-float"
            }
          >
            {message.positive ? <span aria-hidden className="size-2 shrink-0 rounded-full bg-on-accent" /> : null}
            <span className="truncate">
              {message.title}
              {message.detail ? <span className="font-medium opacity-75"> · {message.detail}</span> : null}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

interface WayOut {
  key: string;
  /** Why it is worth doing: how many more cars it deals. */
  reason: string;
  label: string;
  apply: () => void;
}

function EmptyDeck({
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
}: {
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
}) {
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
      className="flex h-full flex-col items-center justify-center rounded-card border border-dashed border-line-strong px-7 text-center"
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

/** Shown while the browser-only deck is loading. Mirrors its layout. */
export function DeckSkeleton() {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full max-w-[30rem] flex-1 flex-col">
        <div className="box-content flex h-14 shrink-0 items-center px-5 pt-safe">
          <Wordmark />
        </div>
        <div className="h-12 shrink-0" />
        <div className="min-h-0 flex-1 px-4 pb-8 short:pb-7">
          <div className="mx-auto flex h-full max-h-[42rem] w-full max-w-[26rem] animate-pulse items-center justify-center rounded-card bg-surface text-sm text-fg-faint">
            {copy.deck.loading}
          </div>
        </div>
        <div className="h-28 shrink-0" />
      </div>
    </div>
  );
}
