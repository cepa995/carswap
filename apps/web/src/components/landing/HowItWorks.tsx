"use client";

import { ArrowRight, KeyRound, Pause, Play, Warehouse } from "lucide-react";
import { useInView, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type { DeckCard } from "@/lib/domain/deck";
import { CarScene, DirectionScene, MatchScene, SwipeScene } from "./HowScenes";

const steps = copy.landing.steps;

/**
 * "Kako ide zamena": four steps, each shown with the piece of the app it is
 * about.
 *
 * This is a phone app, so the phone layout is the real one. There the steps
 * simply follow each other down the page, and under each sits its piece of
 * the app at full size, straight on the page with nothing drawn around it:
 * the visitor's own phone is the frame. Each piece comes to life as it
 * scrolls into view, and the deck in step three can be swiped for real.
 *
 * A desktop has no phone around the page, so there one is drawn, and the same
 * pieces take turns on its screen next to the list of steps.
 */
export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
      <h2 className="font-display text-4xl leading-none font-extrabold tracking-tight text-balance sm:text-5xl">
        {copy.landing.howTitle}
      </h2>
      <p className="mt-3 text-lg text-pretty text-fg-muted">{copy.landing.howLead}</p>

      <DownThePage />
      <OnADrawnPhone />
    </section>
  );
}

function StepNumber({ active = true, children }: { active?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full font-display text-base font-bold tabular-nums ring-1 transition duration-300 ease-out-expo ring-inset",
        active ? "bg-accent text-on-accent ring-accent" : "bg-surface text-fg ring-line-strong",
      )}
    >
      {children}
    </span>
  );
}

/** Where the four steps lead, and the way in. */
function Finish({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="flex items-center gap-3 font-display text-xl font-bold tracking-tight">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fg text-canvas">
          <KeyRound className="size-[1.1rem]" aria-hidden />
        </span>
        {copy.landing.howEnd}
      </p>
      <Link
        href="/swipe"
        transitionTypes={["nav-forward"]}
        className={buttonClass({ size: "lg", className: "mt-5 w-full sm:w-auto" })}
      >
        {copy.landing.cta}
        <ArrowRight className="size-5" aria-hidden />
      </Link>
    </div>
  );
}

// ── On a phone: one step after another, down the page ────────────────────

function DownThePage() {
  const [matched, setMatched] = useState<DeckCard | null>(null);

  return (
    // A swiped card leaves sideways; clipping at the screen's edge keeps it from widening the page.
    <div className="-mx-5 overflow-x-clip px-5 lg:hidden">
      <ol className="mt-10">
        <Step index={0}>{(still) => <CarScene still={still} />}</Step>
        <Step index={1}>{(still) => <DirectionScene still={still} />}</Step>
        <Step index={2}>{(still) => <SwipeScene still={still} onMatch={setMatched} />}</Step>
        <Step index={3}>{(still) => <MatchScene still={still} card={matched ?? undefined} />}</Step>
      </ol>
      <Finish className="mt-10" />
    </div>
  );
}

function Step({ index, children }: { index: number; children: (still: boolean) => ReactNode }) {
  const scene = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  // A scene performs once, when enough of it is on screen to be watched.
  const seen = useInView(scene, { amount: 0.4, once: true });
  const step = steps[index];

  return (
    <li className="mt-14 first:mt-0 sm:mt-16 sm:grid sm:grid-cols-[minmax(0,1fr)_22rem] sm:items-center sm:gap-x-10">
      <div>
        <div className="flex items-center gap-3">
          <StepNumber>{index + 1}</StepNumber>
          <h3 className="font-display text-[1.75rem] leading-none font-bold tracking-tight">{step.title}</h3>
        </div>
        <p className="mt-3 leading-relaxed text-pretty text-fg-muted">{step.body}</p>
      </div>
      <div ref={scene} className="mt-5 sm:mt-0">
        {children(reduceMotion || !seen)}
      </div>
    </li>
  );
}

// ── On a desktop: the same pieces, on the screen of a drawn phone ────────

/** How long each step holds the phone's screen before the next takes over. */
const HOLD_MS = [5200, 5800, 7000, 6000];
/** After a like, a beat to see the card go before the screen turns to the match. */
const MATCH_AFTER_MS = 650;

function OnADrawnPhone() {
  const reduceMotion = useReducedMotion() ?? false;
  const phone = useRef<HTMLDivElement>(null);
  const onScreen = useInView(phone, { amount: 0.4 });

  const [active, setActive] = useState(0);
  /** Goes up each time a step takes the screen, so its timer starts from nothing. */
  const [take, setTake] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [seen, setSeen] = useState(false);
  const [matched, setMatched] = useState<DeckCard | null>(null);
  if (onScreen && !seen) setSeen(true);

  // Only the step on screen performs; the rest hold their finished picture, out of sight.
  const stillAt = (index: number) => reduceMotion || !seen || index !== active;

  function show(index: number) {
    setActive(index);
    setTake((count) => count + 1);
  }

  function pick(index: number) {
    show(index);
    setAutoplay(false);
  }

  function toggleAutoplay() {
    if (!autoplay) setTake((count) => count + 1);
    setAutoplay(!autoplay);
  }

  function handleMatch(card: DeckCard) {
    setMatched(card);
    // As in the app: a like on a swap turns the whole screen to the match.
    window.setTimeout(() => pick(3), MATCH_AFTER_MS);
  }

  const scenes: ReadonlyArray<{ fullScreen?: boolean; scene: ReactNode }> = [
    { scene: <CarScene still={stillAt(0)} /> },
    { scene: <DirectionScene still={stillAt(1)} /> },
    { scene: <SwipeScene still={stillAt(2)} onMatch={handleMatch} fill /> },
    { fullScreen: true, scene: <MatchScene still={stillAt(3)} card={matched ?? undefined} fill /> },
  ];

  return (
    <div className="mt-10 hidden lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-x-14">
      <div>
        <ol className="flex flex-col gap-1.5">
          {steps.map((step, index) => {
            const current = index === active;
            return (
              <li key={step.title} aria-current={current ? "step" : undefined}>
                <button
                  type="button"
                  onClick={() => pick(index)}
                  className={cn(
                    "group relative flex w-full items-start gap-4 overflow-hidden rounded-3xl p-4 pr-5 text-left ring-1 transition duration-300 ease-out-expo",
                    current ? "bg-surface shadow-float ring-line" : "ring-transparent hover:bg-surface/60",
                  )}
                >
                  <StepNumber active={current}>{index + 1}</StepNumber>
                  <span className="min-w-0 pt-0.5">
                    <span className="block font-display text-2xl leading-tight font-bold tracking-tight">
                      {step.title}
                    </span>
                    <span className="mt-1 block text-[15px] leading-relaxed text-pretty text-fg-muted">
                      {step.body}
                    </span>
                  </span>
                  {/* The step's timer. Its end is what hands the screen to the next step.
                      Hidden for a visitor who asked for less motion, and an element that
                      is not drawn runs no animation, so for them nothing moves on by itself.
                      Done in CSS because the server cannot know the preference. */}
                  {current && autoplay ? (
                    <span
                      key={take}
                      aria-hidden
                      className="how-fill absolute inset-x-0 bottom-0 h-1 bg-accent motion-reduce:hidden"
                      style={{
                        animationDuration: `${HOLD_MS[index]}ms`,
                        animationPlayState: onScreen ? "running" : "paused",
                      }}
                      onAnimationEnd={() => show((index + 1) % steps.length)}
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
        <Finish className="mt-6 pl-4" />
      </div>

      <div>
        {/* Touching anything on the phone means the visitor has taken over; the tour stops and waits. */}
        <div
          ref={phone}
          role="group"
          aria-label={copy.landing.howPhone}
          onPointerDownCapture={() => setAutoplay(false)}
          className="relative mx-auto w-[23rem] rounded-[3.25rem] bg-fg p-2.5 shadow-card"
        >
          <span
            aria-hidden
            className="absolute top-[1.375rem] left-1/2 z-20 -ml-11 h-6 w-[5.5rem] rounded-full bg-fg"
          />
          <div
            data-compact
            className="relative isolate h-[min(43rem,calc(100vh-7rem))] min-h-[33rem] overflow-hidden rounded-[2.7rem] bg-canvas"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 ambient" />
            <div aria-hidden className="flex h-[4.75rem] items-end justify-between px-5 pb-2.5">
              <Wordmark className="text-lg" />
              <span className="flex h-8 items-center gap-1.5 rounded-full bg-surface px-3 text-xs font-semibold shadow-chip ring-1 ring-line">
                <Warehouse className="size-3.5" />
                {copy.nav.garage}
              </span>
            </div>

            {scenes.map(({ fullScreen, scene }, index) => (
              <div
                key={steps[index].title}
                inert={index !== active}
                className={cn(
                  "absolute inset-x-0 bottom-0 transition-opacity duration-300",
                  fullScreen ? "top-0 z-10" : "top-[4.75rem] flex flex-col justify-center px-4 pb-8",
                  index === active ? "opacity-100" : "pointer-events-none opacity-0",
                )}
              >
                {scene}
              </div>
            ))}
          </div>
        </div>

        {/* Nothing plays by itself with reduced motion, so there is nothing to pause. */}
        <div className="mt-4 flex justify-center motion-reduce:hidden">
          <button
            type="button"
            onClick={toggleAutoplay}
            className="flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-semibold text-fg-muted transition duration-150 ease-out-expo hover:bg-raised hover:text-fg active:scale-95"
          >
            {autoplay ? (
              <Pause className="size-3.5 fill-current" strokeWidth={0} aria-hidden />
            ) : (
              <Play className="size-3.5 fill-current" strokeWidth={0} aria-hidden />
            )}
            {autoplay ? copy.landing.howPause : copy.landing.howPlay}
          </button>
        </div>
      </div>
    </div>
  );
}
