"use client";

import { ArrowLeftRight, Check, Heart, Warehouse, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useTransform, type Variants } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CarCard } from "@/components/deck/CarCard";
import { GalleryCard } from "@/components/deck/GalleryCard";
import { SwipeDeck, type SwipeDeckHandle } from "@/components/deck/SwipeDeck";
import { Bays } from "@/components/garage/GaragePanel";
import { FLIGHT_SECONDS, useParking } from "@/components/garage/Parking";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { CarChip } from "@/components/ui/CarChip";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { copy, fuelLabel } from "@/lib/copy";
import { dealLine, describeDeal } from "@/lib/deal-display";
import type { DeckCard } from "@/lib/domain/deck";
import type { SwipeDirection } from "@/lib/domain/types";
import { formatEur, formatKm } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { useIsDesktop } from "@/lib/media";
import { springs } from "@/lib/motion";
import { EXAMPLE_CAR } from "@/lib/reference";
import { listingName } from "@/lib/share";
import { rise, stage, type Phase } from "./entrance";
import { exampleEstimate, examples } from "./how-examples";

/**
 * What each step of "Kako ide zamena" shows: a real piece of the app, at the
 * size it has on a phone, as wide as whatever holds it. On a phone that is
 * the page itself; on a big screen it is one of four columns.
 *
 * Two of them are the real thing. The direction control really switches, and
 * the deck is the app's own swipe deck with the app's own card, so a visitor
 * can try the gesture before going anywhere.
 *
 * Each takes the phase of its entrance (see `entrance.ts`): finished and
 * still, waiting at its first frame, or performing.
 */
export interface SceneProps {
  phase: Phase;
}

/**
 * Every scene is one card of the same make, and takes all the height it is
 * given: side by side on a big screen they come out the same size, whatever
 * is inside each. Each is marked `data-piece`, which is how the tests find
 * them to hold them to that.
 */
const sceneCard = "flex h-full flex-col overflow-hidden rounded-[2rem] bg-surface shadow-card ring-1 ring-line";

/** As wide as a phone's content column, at any breakpoint the scenes appear at. */
const PHOTO_SIZES = "(min-width: 640px) 22rem, 92vw";

/** The line before the figure on a card: whose car, and which way the money goes. */
function DealLead({ card, className }: { card: DeckCard; className?: string }) {
  const { kind } = describeDeal(card.deal, card.listing);
  return (
    <span className={cn("flex items-center gap-2 font-medium text-fg-muted", className)}>
      <CarChip className="text-[0.92em]">{EXAMPLE_CAR.model}</CarChip>
      {kind === "top-up" ? <span className="text-[1.4em] leading-none font-semibold text-fg">+</span> : null}
      {kind === "even" ? <span className="text-[1.4em] leading-none font-semibold text-fg">=</span> : null}
      {kind === "cash-back" ? <span>{copy.deal.cashBackSuffix}</span> : null}
    </span>
  );
}

// ── 1. Reci šta voziš ────────────────────────────────────────────────────

const ANSWERS: ReadonlyArray<readonly [string, string]> = [
  [copy.wizard.makeLabel, EXAMPLE_CAR.make],
  [copy.wizard.modelLabel, EXAMPLE_CAR.model],
  [copy.details.year, String(EXAMPLE_CAR.year)],
  [copy.details.km, formatKm(EXAMPLE_CAR.km)],
  [copy.details.fuel, fuelLabel[EXAMPLE_CAR.fuel]],
];
const ESTIMATE_AT = 2.2;

/** The five answers fill in one after another, as on a form, then the estimate counts up. */
export function CarScene({ phase }: SceneProps) {
  // The numbers count from nothing only when performing, and start over each time they do.
  const from = phase === "playing" ? 0 : undefined;

  return (
    <motion.div aria-hidden data-piece="car" className={cn(sceneCard, "@container p-5")} {...stage(phase)}>
      <p className="shrink-0 font-display text-2xl leading-none font-bold tracking-tight @sm:text-[1.75rem]">
        {copy.wizard.title}
      </p>
      {/* Given more height than they need, the answers share it out, so the card is full at any size. */}
      <ul className="mt-3 flex flex-auto flex-col">
        {ANSWERS.map(([label, value], index) => (
          <motion.li
            key={label}
            variants={rise(0.3 + index * 0.34, 8)}
            className="flex flex-auto items-center justify-between gap-3 border-b border-line py-2.5 last:border-b-0"
          >
            {/* Where the card is at its widest, two to a row, the print grows with it. */}
            <span className="text-sm text-fg-muted @sm:text-base">{label}</span>
            <span className="flex items-center gap-2 text-[15px] font-semibold @sm:gap-2.5 @sm:text-lg">
              {value}
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent @sm:size-6">
                <Check className="size-3 @sm:size-3.5" strokeWidth={3.5} />
              </span>
            </span>
          </motion.li>
        ))}
      </ul>

      <motion.div variants={rise(ESTIMATE_AT)} className="mt-4 shrink-0 rounded-3xl bg-raised p-4">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm font-medium text-fg-muted">
          <CarChip className="text-[0.9rem]">
            {EXAMPLE_CAR.model} · {EXAMPLE_CAR.year}
          </CarChip>
          {copy.wizard.resultLead}
        </div>
        <p className="mt-2.5 font-display text-[clamp(1.6rem,12.5cqw,2.5rem)] leading-none font-extrabold tracking-tight tabular-nums">
          <AnimatedNumber key={`low:${phase}`} value={exampleEstimate.low} from={from} delay={ESTIMATE_AT} />
          <span className="mx-[0.12em] text-fg-faint">–</span>
          <AnimatedNumber key={`high:${phase}`} value={exampleEstimate.high} from={from} delay={ESTIMATE_AT} /> €
        </p>
      </motion.div>
    </motion.div>
  );
}

// ── 2. Skuplji ili jeftiniji? ────────────────────────────────────────────

const CHOICES = [
  { label: copy.pref.up, hint: copy.pref.upHint, card: examples.up },
  { label: copy.pref.down, hint: copy.pref.downHint, card: examples.down },
  { label: copy.pref.any, hint: copy.pref.anyHint, card: examples.even },
];
/** When, left alone, the control shows the other answer by itself. */
const SHOW_OTHER_AFTER_MS = 2200;

/**
 * The app's three-way choice, working: each answer brings a different car and
 * a different kind of deal. Left alone, it flips to "cheaper" once by itself,
 * so the point is made even if nobody touches it.
 */
export function DirectionScene({ phase }: SceneProps) {
  const [selected, setSelected] = useState(0);
  const [touched, setTouched] = useState(false);
  const [showingTap, setShowingTap] = useState(false);

  useEffect(() => {
    if (phase !== "playing" || touched) return;
    const tap = window.setTimeout(() => setShowingTap(true), SHOW_OTHER_AFTER_MS - 350);
    const flip = window.setTimeout(() => setSelected(1), SHOW_OTHER_AFTER_MS);
    return () => {
      window.clearTimeout(tap);
      window.clearTimeout(flip);
    };
  }, [phase, touched]);

  function choose(index: number) {
    setTouched(true);
    if (index === selected) return;
    setSelected(index);
    haptic("tick");
  }

  // Arrow keys move the choice and the focus with it, as in a native radio group.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
    if (!forward && !backward) return;
    event.preventDefault();
    const next = (selected + (forward ? 1 : -1) + CHOICES.length) % CHOICES.length;
    choose(next);
    event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  }

  const { card } = CHOICES[selected];
  const display = describeDeal(card.deal, card.listing);

  return (
    <div data-piece="direction" className={sceneCard}>
      <div
        role="radiogroup"
        aria-label={copy.pref.title}
        onKeyDown={onKeyDown}
        className="relative m-3 mb-0 grid shrink-0 grid-cols-3 rounded-[1.3rem] bg-raised p-1 ring-1 ring-line ring-inset"
      >
        <div aria-hidden className="pointer-events-none absolute inset-1">
          {/* One column wide, so each step of 100% lands it on the next answer. */}
          <motion.span
            className="absolute inset-y-0 left-0 w-1/3 rounded-[1.1rem] bg-fg"
            initial={false}
            animate={{ x: `${selected * 100}%` }}
            transition={springs.snappy}
          />
        </div>
        {CHOICES.map((choice, index) => (
          <button
            key={choice.label}
            type="button"
            role="radio"
            aria-checked={index === selected}
            tabIndex={index === selected ? 0 : -1}
            onClick={() => choose(index)}
            className="relative rounded-[1.1rem] px-1 py-2 text-center transition-transform duration-200 ease-out-expo active:scale-[0.97]"
          >
            <span
              className={cn(
                "block text-[15px] leading-tight font-semibold transition-colors duration-200",
                index === selected && "text-canvas",
              )}
            >
              {choice.label}
            </span>
            <span
              className={cn(
                "block text-[11px] leading-tight transition-colors duration-200",
                index === selected ? "text-canvas/75" : "text-fg-faint",
              )}
            >
              {choice.hint}
            </span>
            {/* The fingertip that makes the switch when nobody else does. */}
            {index === 1 && showingTap && !touched ? (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-1/2 -mt-5 -ml-5 size-10 rounded-full bg-accent/40"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: [0.4, 1, 1.8], opacity: [0, 1, 0] }}
                transition={{ duration: 0.7, times: [0, 0.45, 1] }}
              />
            ) : null}
          </button>
        ))}
      </div>

      {/* The car changes inside the card; the card itself stays put. */}
      <div aria-hidden className="mt-3 grid flex-auto">
        <AnimatePresence initial={false}>
          <motion.div
            key={card.listing.id}
            className="col-start-1 row-start-1 flex flex-col"
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -48 }}
            transition={springs.settle}
          >
            {/* Takes whatever height the card has to spare. */}
            <div className="relative aspect-[2/1] flex-auto bg-raised">
              <Image src={card.listing.photo.src} alt="" fill sizes={PHOTO_SIZES} className="object-cover" />
            </div>
            <div className="shrink-0 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate font-display text-xl leading-tight font-bold tracking-tight">
                  {listingName(card.listing)}
                </p>
                <p className="shrink-0 text-sm font-medium text-fg-faint tabular-nums">
                  {formatEur(card.listing.priceEur)}
                </p>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <DealLead card={card} className="text-sm" />
                <span className="font-display text-[2rem] leading-none font-bold tracking-tight text-accent-strong tabular-nums">
                  {display.value}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="sr-only" aria-live="polite">
        {listingName(card.listing)}: {dealLine(display, EXAMPLE_CAR.model)}
      </p>
    </div>
  );
}

// ── 3. Prevlači ──────────────────────────────────────────────────────────

const TOAST_MS = 2200;
const stamps = { like: copy.deck.stampLike, pass: copy.deck.stampPass };
const cardId = (card: DeckCard) => card.listing.id;

interface SwipeSceneProps extends SceneProps {
  /** A card was liked: the dealer takes the example car for it. */
  onMatch?: (card: DeckCard) => void;
}

/**
 * The app's own deck and its own card, with a handful of example cars. It can
 * be dragged or driven with the two buttons, exactly as in the app; when it
 * runs out it deals again. Untouched, the top card leans each way once to
 * show what to do.
 */
export function SwipeScene({ phase, onMatch }: SwipeSceneProps) {
  const [remaining, setRemaining] = useState<readonly DeckCard[]>(examples.deck);
  const [touched, setTouched] = useState(false);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const deck = useRef<SwipeDeckHandle>(null);

  const intent = useMotionValue(0);
  const passScale = useTransform(intent, [-1, 0], [1.08, 1]);
  const likeScale = useTransform(intent, [0, 1], [1, 1.08]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleSwipe = useCallback(
    (card: DeckCard, direction: SwipeDirection) => {
      setTouched(true);
      setRemaining((cards) => {
        const rest = cards.filter((candidate) => candidate !== card);
        // Out of cards: deal the same ones again. It is a taste, not the stock.
        return rest.length > 0 ? rest : examples.deck;
      });
      track("landing_demo_swiped", { listingId: card.listing.id, direction });
      if (direction !== "like") {
        haptic("commit");
        return;
      }
      haptic("match");
      setToast({ key: Date.now(), text: dealLine(describeDeal(card.deal, card.listing), EXAMPLE_CAR.model) });
      onMatch?.(card);
    },
    [onMatch],
  );

  return (
    <div onPointerDownCapture={() => setTouched(true)}>
      <div className="relative mx-auto aspect-[10/13] w-full max-w-[21rem]">
        <SwipeDeck
          ref={deck}
          items={remaining}
          getId={cardId}
          intent={intent}
          stamps={stamps}
          nudge={phase !== "armed" && !touched}
          nudgeAfterMs={900}
          scrollsWithPage
          onSwipe={handleSwipe}
          renderCard={(card) => <CarCard card={card} car={EXAMPLE_CAR} embedded />}
        />

        <div className="pointer-events-none absolute inset-x-0 -top-4 z-40 flex justify-center" role="status">
          <AnimatePresence>
            {toast ? (
              <motion.p
                key={toast.key}
                className="flex max-w-full items-center gap-2.5 rounded-full bg-accent py-2 pr-4 pl-3 text-sm font-semibold text-on-accent shadow-accent"
                initial={{ y: -14, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -10, opacity: 0, scale: 0.96 }}
                transition={springs.snappy}
              >
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-on-accent" />
                <span className="truncate">
                  {copy.deck.matchToast}
                  <span className="font-medium opacity-80"> · {toast.text}</span>
                </span>
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="mx-auto mt-11 flex w-full max-w-[21rem] items-center gap-2.5">
        <motion.button
          type="button"
          style={{ scale: passScale }}
          whileTap={{ scale: 0.94 }}
          onClick={() => deck.current?.swipe("pass")}
          className="flex h-14 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-surface text-base font-semibold shadow-float ring-1 ring-line-strong hover:bg-raised"
        >
          <X className="size-5" strokeWidth={3} aria-hidden />
          {copy.deck.pass}
        </motion.button>
        <motion.button
          type="button"
          style={{ scale: likeScale }}
          whileTap={{ scale: 0.94 }}
          onClick={() => deck.current?.swipe("like")}
          className="flex h-14 min-w-0 flex-[1.3] items-center justify-center gap-2 rounded-full bg-accent text-base font-semibold text-on-accent shadow-accent hover:bg-accent-strong"
        >
          <Heart className="size-5 fill-current" strokeWidth={2} aria-hidden />
          {copy.deck.like}
        </motion.button>
      </div>
      <p className="mt-3 text-center text-sm text-fg-muted">{copy.landing.howTry}</p>
    </div>
  );
}

// ── 3, on a big screen. Parkiraj šta ti se sviđa ─────────────────────────

/** Bays in the little garage under the card. When they are full, it empties for the next round. */
const DEMO_BAYS = 3;
/** When, left alone, the first car parks by itself. */
const PARK_ITSELF_AFTER_MS = 1500;
const LANDING_MS = FLIGHT_SECONDS * 1000;
/** From this scene's start to its first car standing in its bay: the cue for the step after it. */
export const PARKED_AFTER_MS = PARK_ITSELF_AFTER_MS + LANDING_MS;

/**
 * What step three is on a big screen, where nothing is swiped: one card from
 * the app's gallery, and under it a few bays of garage. "Menjam" sends the
 * car's picture over to a bay, exactly as it does in the app. Left alone, the
 * first car parks by itself so the point is made without a click.
 *
 * `onMatch` is told once the car is in its bay, not at the click, so whatever
 * celebrates it does so after the parking and not over it.
 */
export function ParkScene({ phase, onMatch }: SceneProps & { onMatch?: (card: DeckCard) => void }) {
  const [waiting, setWaiting] = useState<readonly DeckCard[]>(examples.deck);
  const [parked, setParked] = useState<readonly DeckCard[]>([]);
  const [touched, setTouched] = useState(false);
  // A new object for every parking, so the same car parked again is news again.
  const [landing, setLanding] = useState<{ card: DeckCard } | null>(null);
  const parking = useParking();
  const photo = useRef<HTMLElement | null>(null);
  // On a phone this scene is in the page but not shown; it should not perform for nobody.
  const onShow = useIsDesktop();
  const card = waiting[0];

  // Out of cars: the same ones come round again. It is a taste, not the stock.
  const next = () => setWaiting((cars) => (cars.length > 1 ? cars.slice(1) : examples.deck));

  const like = useCallback(
    (byHand: boolean) => {
      parking.park(card.listing.id, photo.current, card.listing.photo.src);
      setParked((cars) => {
        // The cars come round again: one that is still parked goes back to its own bay.
        if (cars.some((other) => other.listing.id === card.listing.id)) return cars;
        return cars.length >= DEMO_BAYS ? [card] : [...cars, card];
      });
      setLanding({ card });
      next();
      if (!byHand) return;
      haptic("match");
      track("landing_demo_swiped", { listingId: card.listing.id, direction: "like" });
    },
    [parking, card],
  );

  useEffect(() => {
    if (!landing) return;
    const timer = window.setTimeout(() => onMatch?.(landing.card), LANDING_MS);
    return () => window.clearTimeout(timer);
  }, [landing, onMatch]);

  useEffect(() => {
    if (phase !== "playing" || touched || !onShow) return;
    const timer = window.setTimeout(() => like(false), PARK_ITSELF_AFTER_MS);
    return () => window.clearTimeout(timer);
    // Once, when the scene starts: later changes of car must not park another.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, touched, onShow]);

  return (
    <div data-piece="park" className={sceneCard} onPointerDownCapture={() => setTouched(true)}>
      {/* The next car slides in where the last one was; the card around them stays put. */}
      <div className="grid flex-auto">
        <AnimatePresence initial={false}>
          <motion.div
            key={card.listing.id}
            className="col-start-1 row-start-1 flex"
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -48 }}
            transition={springs.settle}
          >
            <GalleryCard
              card={card}
              car={EXAMPLE_CAR}
              compact
              bare
              heading="h4"
              photoRef={(element) => {
                photo.current = element;
              }}
              onPass={() => {
                next();
                haptic("commit");
                track("landing_demo_swiped", { listingId: card.listing.id, direction: "pass" });
              }}
              onLike={() => like(true)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="shrink-0 border-t border-line bg-raised/80 p-3">
        <p className="flex items-center justify-between gap-2 px-1 pb-2 text-sm">
          <span className="flex items-center gap-2 font-semibold">
            <Warehouse className="size-4 text-accent-strong" aria-hidden />
            {copy.nav.garage}
          </span>
          <span className="text-xs text-fg-muted">{copy.landing.howTryDesktop}</span>
        </p>
        <Bays
          parked={parked}
          carModel={EXAMPLE_CAR.model}
          arriving={parking.arriving}
          bays={DEMO_BAYS}
          columns={3}
          labels={false}
        />
      </div>
      {parking.flights}
    </div>
  );
}

// ── 4. Može zamena ───────────────────────────────────────────────────────

// Fixed directions, so the burst is the same on every run.
const CONFETTI = Array.from({ length: 16 }, (_, index) => {
  const angle = (index / 16) * Math.PI * 2 + (index % 3) * 0.22;
  const distance = 110 + ((index * 47) % 70);
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance - 24,
    rotate: ((index * 67) % 360) - 180,
    tone: ["bg-fg", "bg-canvas", "bg-fg", "bg-[#ffc2c5]"][index % 4],
    wide: index % 2 === 0,
    delay: (index % 6) * 0.018,
  };
});

const CHECKS_AT = 1.4;

interface MatchSceneProps extends SceneProps {
  /** The car to celebrate: the one the visitor liked, or the first in the deck until they have. */
  card?: DeckCard;
}

/**
 * The app's match moment, and after it the three things left to do, ticking
 * off one by one.
 *
 * While it waits for its turn it is an empty bay, dashed like the ones in the
 * garage: a place the swap is about to land in. A red panel with nothing on
 * it would look like something that failed to load.
 */
export function MatchScene({ phase, card = examples.deck[0] }: MatchSceneProps) {
  // A new car to celebrate is a new celebration: mounted afresh, it starts from its first frame.
  return <MatchPanel key={card.listing.id} phase={phase} card={card} />;
}

const settleAt = (delay: number, from: object, to: object): Variants => ({
  hidden: { opacity: 0, ...from },
  shown: { opacity: 1, ...to, transition: { ...springs.bouncy, delay } },
});

function MatchPanel({ phase, card }: Required<MatchSceneProps>) {
  const line = dealLine(describeDeal(card.deal, card.listing), EXAMPLE_CAR.model);
  const waiting = phase === "armed";

  return (
    <motion.div
      aria-hidden
      data-piece="match"
      className={cn(
        "@container relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[2rem] px-5 py-11 text-center outline-2 -outline-offset-2 transition-[background-color,outline-color,box-shadow] duration-300 outline-dashed lg:py-9",
        waiting ? "bg-raised/70 outline-line-strong" : "bg-accent-strong dark-surface shadow-card outline-transparent",
      )}
      {...stage(phase)}
    >
      {/* The texture lies under everything else here, which is why the rest is `relative`. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 grain mix-blend-multiply transition-opacity duration-300",
          waiting ? "opacity-0" : "opacity-25",
        )}
      />
      {/* What the empty bay is for. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200",
          waiting ? "opacity-100" : "opacity-0",
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-hover/70 text-fg-faint">
          <ArrowLeftRight className="size-6" strokeWidth={2.4} />
        </span>
      </div>

      <div className="relative">
        {phase === "playing"
          ? CONFETTI.map((piece, index) => (
              <motion.span
                key={index}
                className={cn(
                  "absolute top-1/2 left-1/2 rounded-full",
                  piece.tone,
                  piece.wide ? "h-2 w-5" : "size-2.5",
                )}
                initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.4 }}
                animate={{ x: piece.x, y: piece.y, opacity: [0, 1, 1, 0], rotate: piece.rotate, scale: 1 }}
                transition={{ duration: 1.25, delay: 0.14 + piece.delay, ease: [0.16, 1, 0.3, 1] }}
              />
            ))
          : null}

        <motion.div
          variants={settleAt(0.06, { scale: 0.6, rotate: 14 }, { scale: 1, rotate: 3 })}
          className="relative aspect-[3/2] w-52 overflow-hidden rounded-[1.5rem] shadow-float ring-4 ring-fg lg:w-[clamp(11rem,66cqw,17rem)]"
        >
          <Image src={card.listing.photo.src} alt="" fill sizes={PHOTO_SIZES} className="object-cover" />
        </motion.div>

        <motion.div
          variants={settleAt(0.24, { x: -70, rotate: -24 }, { x: 0, rotate: -8 })}
          className="absolute -bottom-4 -left-7"
        >
          <CarChip className="text-lg">{EXAMPLE_CAR.model}</CarChip>
        </motion.div>

        <motion.div
          variants={{
            hidden: { scale: 0, rotate: -180 },
            shown: { scale: 1, rotate: 0, transition: { ...springs.bouncy, delay: 0.36 } },
          }}
          className="absolute -right-5 -bottom-5 flex size-12 items-center justify-center rounded-full bg-canvas text-fg shadow-float"
        >
          <ArrowLeftRight className="size-6" strokeWidth={2.6} />
        </motion.div>
      </div>

      <motion.p
        variants={settleAt(0.18, { y: 22, scale: 0.9, rotate: -2 }, { y: 0, scale: 1, rotate: -2 })}
        className="relative mt-10 font-display text-[clamp(2.4rem,15cqw,3.4rem)] leading-[0.9] font-extrabold tracking-tight lg:mt-9"
      >
        {copy.match.title}
      </motion.p>

      <motion.div variants={rise(0.45)} className="relative">
        <p className="mt-4 font-display text-xl leading-none font-bold tracking-tight">{line}</p>
        <p className="mt-2 text-[15px] font-medium text-pretty">{copy.match.body(card.dealer.name)}</p>
      </motion.div>

      <ul className="relative mt-5 flex flex-wrap justify-center gap-2">
        {copy.landing.closingSteps.map((item, index) => (
          <motion.li
            key={item}
            variants={rise(CHECKS_AT + index * 0.5, 10)}
            // Darker than the panel, not lighter: small light text needs the contrast.
            className="flex h-8 items-center gap-2 rounded-full bg-black/20 pr-3.5 pl-1.5 text-sm font-semibold"
          >
            <motion.span
              variants={{
                hidden: { scale: 0 },
                shown: { scale: 1, transition: { ...springs.bouncy, delay: CHECKS_AT + 0.18 + index * 0.5 } },
              }}
              className="flex size-5 items-center justify-center rounded-full bg-fg text-accent-strong"
            >
              <Check className="size-3" strokeWidth={4} />
            </motion.span>
            {item}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
