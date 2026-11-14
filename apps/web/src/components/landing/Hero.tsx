"use client";

import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { MyCarSheet } from "@/components/car/MyCarSheet";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Button, buttonClass } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { track } from "@/lib/analytics";
import { brand } from "@/lib/brand";
import { useCurrentYear } from "@/lib/clock";
import { copy } from "@/lib/copy";
import { describeDeal } from "@/lib/deal-display";
import { BUDGET_MAX, BUDGET_MIN, BUDGET_STEP, buildCards, type DeckCard } from "@/lib/domain/deck";
import { carsWord, formatEur } from "@/lib/format";
import { springs } from "@/lib/motion";
import { EXAMPLE_CAR } from "@/lib/reference";
import { dealers, listings } from "@/lib/seed";
import { useApp } from "@/lib/store";
import { useEstimate } from "@/lib/useEstimate";

const FAN_SIZE = 5;
const NEUTRAL_GLOW = "#2b4ba8";

export function Hero() {
  const router = useRouter();
  const currentYear = useCurrentYear();
  const savedCar = useApp((state) => state.car);
  const budget = useApp((state) => state.budget);
  const setBudget = useApp((state) => state.setBudget);
  const [carSheetOpen, setCarSheetOpen] = useState(false);

  const car = savedCar ?? EXAMPLE_CAR;

  const estimate = useEstimate(car);
  const swaps = useMemo(() => {
    return buildCards({ listings, dealers, car, estimate, budget, currentYear })
      .filter((card) => card.deal.status === "swap")
      .sort((a, b) => a.listing.priceEur - b.listing.priceEur);
  }, [car, estimate, budget, currentYear]);

  // The best the budget buys: as the slider moves right, better cars arrive.
  const fan = swaps.slice(-FAN_SIZE);
  const glow = fan.at(-1)?.listing.photo.tint ?? NEUTRAL_GLOW;

  useEffect(() => {
    track("landing_viewed", {});
  }, []);

  function openCarSheet() {
    setCarSheetOpen(true);
    track("car_flow_opened", { source: "landing" });
  }

  return (
    <section className="relative isolate overflow-hidden" style={{ "--glow": glow } as CSSProperties}>
      {/* Faded out towards the bottom so the hero melts into the page instead of ending on a line. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
      >
        <div className="absolute inset-0 ambient" />
        <div className="absolute inset-0 grain opacity-[0.06]" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 pt-28 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:px-8 lg:pt-36 lg:pb-24">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-sky uppercase">
            {copy.landing.eyebrow(brand.city)}
          </p>
          <h1 className="mt-4 font-display text-[3.1rem] leading-[0.92] font-extrabold tracking-[-0.035em] text-balance min-[23rem]:text-[3.6rem] sm:text-7xl lg:text-[5.4rem]">
            {copy.landing.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-fg-muted">{copy.landing.lead}</p>

          <div className="mt-8 hidden flex-wrap gap-3 lg:flex">
            <Link href="/swipe" transitionTypes={["nav-forward"]} className={buttonClass({ size: "lg" })}>
              {copy.landing.cta}
              <ArrowRight className="size-5" aria-hidden />
            </Link>
            <Button variant="secondary" size="lg" onClick={openCarSheet}>
              {savedCar ? copy.car.edit : copy.landing.ctaCar}
            </Button>
          </div>
        </div>

        <div className="relative rounded-[2.25rem] bg-surface/85 p-5 shadow-card ring-1 ring-line-strong ring-inset sm:p-7">
          {/* The equation: your car + top-up = … */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
            <button
              type="button"
              onClick={openCarSheet}
              aria-label={`${copy.landing.equationCar}: ${car.make} ${car.model}, ${car.year}. ${copy.car.edit}`}
              className="rounded-[0.7rem] transition duration-150 ease-out-expo hover:-translate-y-0.5 active:scale-[0.97]"
            >
              <Plate className="text-[1.15rem] sm:text-xl">
                {car.model} · {car.year}
              </Plate>
            </button>
            <span aria-hidden className="font-display text-3xl font-bold text-fg-muted">
              +
            </span>
            <span className="font-display text-[2rem] leading-none font-extrabold tracking-tight sm:text-4xl">
              {budget === 0 ? (
                copy.budget.evenSwap
              ) : (
                <>
                  <AnimatedNumber value={budget} /> €
                </>
              )}
            </span>
          </div>

          <RangeSlider
            className="mt-3"
            value={budget}
            min={BUDGET_MIN}
            max={BUDGET_MAX}
            step={BUDGET_STEP}
            onChange={setBudget}
            label={copy.budget.sliderLabel}
            valueText={formatEur(budget)}
          />

          <p className="mt-1 flex items-baseline gap-2.5">
            <span aria-hidden className="font-display text-3xl font-bold text-fg-muted">
              =
            </span>
            <span className="font-display text-[2rem] leading-none font-extrabold tracking-tight sm:text-4xl">
              <AnimatedNumber value={swaps.length} /> {carsWord(swaps.length)}
            </span>
          </p>

          <Fan cards={fan} />

          {savedCar ? null : <p className="mt-1 text-center text-xs text-fg-faint">{copy.landing.exampleNote}</p>}

          <div className="mt-5 flex flex-col gap-2.5 lg:hidden">
            <Link href="/swipe" transitionTypes={["nav-forward"]} className={buttonClass({ size: "lg" })}>
              {copy.landing.cta}
              <ArrowRight className="size-5" aria-hidden />
            </Link>
            <Button variant="secondary" size="lg" onClick={openCarSheet}>
              {savedCar ? copy.car.edit : copy.landing.ctaCar}
            </Button>
          </div>
        </div>
      </div>

      <MyCarSheet
        open={carSheetOpen}
        onOpenChange={setCarSheetOpen}
        onDone={() => router.push("/swipe", { transitionTypes: ["nav-forward"] })}
      />
    </section>
  );
}

/** Where each card sits, best first: the centre, then alternating outwards. */
const FAN_SLOTS = [0, 1, -1, 2, -2];

/**
 * Up to five cars the equation produces, held like a hand of cards. The best
 * one the budget buys is in front with its top-up; the rest peek out behind.
 */
function Fan({ cards }: { cards: DeckCard[] }) {
  const reduceMotion = useReducedMotion();
  const count = cards.length;
  // `cards` is cheapest first; rank 0 is the most car for the money.
  const ranked = [...cards].reverse();

  return (
    <div className="relative mt-6 h-[8.25rem] [--step:2.1rem] min-[26rem]:[--step:2.7rem] sm:h-[9.75rem] sm:[--step:3.4rem]">
      <AnimatePresence initial={false}>
        {ranked.map((card, rank) => {
          const slot = FAN_SLOTS[rank];
          const distance = Math.abs(slot);
          const display = describeDeal(card.deal, card.listing);
          const pose = { y: distance * distance * 5, scale: 1 - distance * 0.1, rotate: slot * 6 };
          return (
            <motion.div
              key={card.listing.id}
              layout={reduceMotion ? false : "position"}
              className="absolute top-0 -ml-[4.75rem] w-[9.5rem] sm:-ml-[5.75rem] sm:w-[11.5rem]"
              style={{ left: `calc(50% + var(--step) * ${slot})`, zIndex: 10 - distance }}
              initial={{ opacity: 0, y: 40, scale: 0.7, rotate: slot * 6 }}
              animate={{ opacity: 1, ...pose }}
              exit={{ opacity: 0, y: 40, scale: 0.7 }}
              transition={reduceMotion ? { duration: 0 } : springs.settle}
            >
              <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-raised shadow-float ring-1 ring-white/15">
                <Image
                  src={card.listing.photo.src}
                  alt={`${card.listing.make} ${card.listing.model}`}
                  fill
                  sizes="12rem"
                  className="object-cover"
                />
                {slot === 0 ? (
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-canvas/95 via-canvas/70 to-transparent px-3 pt-9 pb-2.5">
                    <p className="truncate text-xs leading-tight font-semibold">
                      {card.listing.make} {card.listing.model}
                    </p>
                    <p className="mt-0.5 font-display text-base leading-none font-bold tabular-nums">
                      {display.kind === "top-up" ? "+ " : ""}
                      {display.value}
                    </p>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-canvas/25" />
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {count === 0 ? (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-fg-muted">
          {copy.landing.equationEmpty}
        </p>
      ) : null}
    </div>
  );
}
