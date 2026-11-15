"use client";

import { ArrowRight, KeyRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { buttonClass } from "@/components/ui/Button";
import { ByScreen } from "@/components/ui/ByScreen";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type { DeckCard } from "@/lib/domain/deck";
import { useIsDesktop, useMediaQuery } from "@/lib/media";
import { useEntrance, type Phase } from "./entrance";
import { CarScene, DirectionScene, MatchScene, PARKED_AFTER_MS, ParkScene, SwipeScene } from "./HowScenes";
import { SectionHeading } from "./SectionHeading";

const steps = copy.landing.steps;

/** With the steps side by side, how long each waits for the one before it, so the row reads left to right. */
const TURN_MS = 1300;

/**
 * How long step `index` holds its first frame once its row is on screen,
 * with `abreast` steps to a row. Alone in its row, it does not wait.
 */
function turnWait(index: number, abreast: number): number {
  const place = index % abreast;
  if (place === 0) return 0;
  // The last step is the answer to the one before it: it waits until that car stands parked.
  if (index === steps.length - 1) return (place - 1) * TURN_MS + PARKED_AFTER_MS + 120;
  return place * TURN_MS;
}

/**
 * "Kako ide zamena": four steps, each shown with the piece of the app it is
 * about, at the size that piece really has.
 *
 * On a phone the steps follow each other down the page, each piece straight
 * on the page with nothing drawn around it, and each plays as it scrolls into
 * view. On a big screen the same four stand side by side as a storyboard and
 * play in turn, left to right.
 *
 * Two of the pieces are the real thing and can be used where they stand: the
 * choice of direction, and step three. That one is the deck to swipe on a
 * phone, and a card with a garage to park it in on a big screen, because that
 * is what the app itself is on each.
 */
export function HowItWorks() {
  const [matched, setMatched] = useState<DeckCard | null>(null);
  const desktop = useIsDesktop();
  const fourAbreast = useMediaQuery("(min-width: 80rem)");
  // How many steps share a row, which is how many take turns.
  const abreast = fourAbreast ? 4 : desktop ? 2 : 1;

  return (
    <section id="kako" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-16 lg:px-8 lg:py-24">
      <SectionHeading>{copy.landing.howTitle}</SectionHeading>
      <p className="mt-3 text-lg text-pretty text-fg-muted">{copy.landing.howLead}</p>

      {/* A swiped card leaves sideways; clipping at the screen's edge keeps it from widening the page. */}
      <div className="-mx-5 overflow-x-clip px-5 lg:mx-0 lg:overflow-x-visible lg:px-0">
        {/* Side by side, the rows alternate: one as tall as its texts, one shared out evenly, so every piece is the same size. */}
        <ol className="mt-10 grid grid-cols-1 gap-y-14 sm:gap-y-16 lg:mt-12 lg:auto-rows-[auto_1fr] lg:grid-cols-2 lg:gap-x-8 lg:gap-y-12 xl:grid-cols-4 xl:gap-x-6">
          <Step index={0} abreast={abreast}>
            {(phase) => <CarScene phase={phase} />}
          </Step>
          <Step index={1} abreast={abreast}>
            {(phase) => <DirectionScene phase={phase} />}
          </Step>
          {/* Both are in the page and CSS shows one, so the right piece is there
              from the first paint, before any script has run. */}
          <Step index={2} abreast={abreast}>
            {(phase) => (
              <>
                <div className="lg:hidden">
                  <SwipeScene phase={phase} onMatch={setMatched} />
                </div>
                {/* Full height, so the card inside can match its neighbours. */}
                <div className="h-full max-lg:hidden">
                  <ParkScene phase={phase} onMatch={setMatched} />
                </div>
              </>
            )}
          </Step>
          <Step index={3} abreast={abreast}>
            {(phase) => <MatchScene phase={phase} card={matched ?? undefined} />}
          </Step>
        </ol>
      </div>

      <Finish className="mt-10 lg:mt-12 lg:flex lg:items-center lg:justify-center lg:gap-6" />
    </section>
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
        className={buttonClass({ size: "lg", className: "mt-5 w-full sm:w-auto lg:mt-0" })}
      >
        <ByScreen phone={copy.landing.cta} desktop={copy.landing.ctaDesktop} />
        <ArrowRight className="size-5" aria-hidden />
      </Link>
    </div>
  );
}

/** Holds a piece at its first frame a little longer, so pieces that come into view together play in turn. */
function useTurn(phase: Phase, waitMs: number): Phase {
  const [up, setUp] = useState(false);
  const due = phase === "playing" && waitMs > 0;

  useEffect(() => {
    if (!due) return;
    const timer = window.setTimeout(() => setUp(true), waitMs);
    return () => window.clearTimeout(timer);
  }, [due, waitMs]);

  return due && !up ? "armed" : phase;
}

interface StepProps {
  index: number;
  /** How many steps stand in one row at this width. */
  abreast: number;
  children: (phase: Phase) => ReactNode;
}

function Step({ index, abreast, children }: StepProps) {
  const scene = useRef<HTMLDivElement>(null);
  // A scene performs once, when enough of it is on screen to be watched, and
  // after the ones to its left have had their start.
  const phase = useTurn(useEntrance(scene, 0.4), turnWait(index, abreast));
  const step = steps[index];
  const last = index === steps.length - 1;

  return (
    <li
      className={cn(
        "relative sm:grid sm:grid-cols-[minmax(0,1fr)_22rem] sm:items-center sm:gap-x-10",
        // Side by side, the text and the piece of every step share two rows of
        // the list. So the pieces in a row start on one line, however long the
        // text above each, and end on one line, whatever is inside each.
        "lg:row-span-2 lg:grid-cols-1 lg:grid-rows-subgrid lg:items-stretch lg:gap-x-0 lg:gap-y-6",
      )}
    >
      <div>
        <div className="flex items-center gap-3">
          <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-display text-base font-bold text-on-accent tabular-nums ring-4 ring-canvas">
            {index + 1}
          </span>
          {/* Four abreast, a line runs from each number to the next, like a route. */}
          {last ? null : (
            <span
              aria-hidden
              className="absolute top-[1.125rem] right-[-1.75rem] left-9 hidden h-0.5 -translate-y-1/2 bg-line-strong xl:block"
            />
          )}
        </div>
        <h3 className="mt-3 font-display text-[1.75rem] leading-none font-bold tracking-tight xl:mt-4 xl:text-2xl xl:leading-tight">
          {"desktop" in step ? <ByScreen phone={step.title} desktop={step.desktop.title} /> : step.title}
        </h3>
        <p className="mt-3 leading-relaxed text-pretty text-fg-muted xl:mt-2 xl:text-[15px]">
          {"desktop" in step ? <ByScreen phone={step.body} desktop={step.desktop.body} /> : step.body}
        </p>
      </div>
      <div ref={scene} className="mt-5 sm:mt-0">
        {children(phase)}
      </div>
    </li>
  );
}
