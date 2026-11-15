"use client";

import { ArrowRight, CarFront } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MyCarSheet } from "@/components/car/MyCarSheet";
import { SwapPreference } from "@/components/car/SwapPreference";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Button, buttonClass } from "@/components/ui/Button";
import { ByScreen } from "@/components/ui/ByScreen";
import { track } from "@/lib/analytics";
import { brand } from "@/lib/brand";
import { useCurrentYear } from "@/lib/clock";
import { copy } from "@/lib/copy";
import { describeDeal } from "@/lib/deal-display";
import { buildCards, wanted, type DeckCard } from "@/lib/domain/deck";
import { carsWord } from "@/lib/format";
import { springs } from "@/lib/motion";
import { EXAMPLE_CAR } from "@/lib/reference";
import { dealers, listings } from "@/lib/seed";
import { useApp } from "@/lib/store";
import { useEstimate } from "@/lib/useEstimate";

const FAN_SIZE = 5;

export function Hero() {
  const router = useRouter();
  const currentYear = useCurrentYear();
  const savedCar = useApp((state) => state.car);
  const budget = useApp((state) => state.budget);
  const direction = useApp((state) => state.direction);
  const minCash = useApp((state) => state.minCash);
  const [carSheetOpen, setCarSheetOpen] = useState(false);

  const car = savedCar ?? EXAMPLE_CAR;

  const estimate = useEstimate(car);
  const swaps = useMemo(() => {
    return buildCards({ listings, dealers, car, estimate, budget, currentYear })
      .filter((card) => wanted(card.deal, { direction, minCash }))
      .sort((a, b) => a.listing.priceEur - b.listing.priceEur);
  }, [car, estimate, budget, direction, minCash, currentYear]);

  // The most car the choice allows: a bigger top-up brings better cars, a bigger
  // demand for cash leaves cheaper ones.
  const fan = swaps.slice(-FAN_SIZE);

  useEffect(() => {
    track("landing_viewed", {});
  }, []);

  function openCarSheet() {
    setCarSheetOpen(true);
    track("car_flow_opened", { source: "landing" });
  }

  const carAction = savedCar ? copy.landing.equationChange : copy.landing.equationEnter;

  return (
    <section className="relative isolate overflow-hidden">
      {/* Faded out towards the bottom so the hero melts into the page instead of ending on a line. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
      >
        <div className="absolute inset-0 ambient" />
        <div className="absolute inset-0 grain opacity-[0.06]" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 pt-28 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:px-8 lg:pt-36 lg:pb-24 xl:gap-20">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-accent-strong uppercase">
            {copy.landing.eyebrow(brand.city)}
          </p>
          <h1 className="mt-4 font-display text-[3.1rem] leading-[0.92] font-extrabold tracking-[-0.035em] text-balance min-[23rem]:text-[3.6rem] sm:text-7xl lg:text-[5.4rem] xl:text-[6.25rem]">
            {copy.landing.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-fg-muted xl:text-xl xl:leading-relaxed">
            <ByScreen phone={copy.landing.lead} desktop={copy.landing.leadDesktop} />
          </p>

          <div className="mt-8 hidden flex-wrap gap-3 lg:flex">
            <Link href="/swipe" transitionTypes={["nav-forward"]} className={buttonClass({ size: "lg" })}>
              {copy.landing.ctaDesktop}
              <ArrowRight className="size-5" aria-hidden />
            </Link>
            <Button variant="secondary" size="lg" onClick={openCarSheet}>
              {savedCar ? copy.car.edit : copy.landing.ctaCar}
            </Button>
          </div>
        </div>

        <div className="relative rounded-[2.25rem] bg-surface p-4 shadow-card ring-1 ring-line sm:p-6 xl:p-8">
          {/* Your car. The whole row is the button, so there is no doubt where to tap. */}
          <button
            type="button"
            onClick={openCarSheet}
            aria-label={`${copy.landing.equationCar}: ${car.make} ${car.model}, ${car.year}. ${carAction}`}
            className="flex w-full items-center gap-3 rounded-[1.4rem] bg-raised p-2.5 pr-4 text-left transition duration-150 ease-out-expo hover:bg-hover active:scale-[0.99]"
          >
            <span
              aria-hidden
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-on-accent"
            >
              <CarFront className="size-6" strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-fg-faint">
                {copy.landing.equationCar}
                {savedCar ? null : ` · ${copy.landing.equationExample}`}
              </span>
              <span className="block truncate font-display text-xl leading-tight font-bold tracking-tight">
                {car.model} · {car.year}
              </span>
            </span>
            <span className="shrink-0 text-sm font-semibold text-accent-strong">{carAction}</span>
          </button>

          {/* Which way to trade, and how much money is in play. */}
          <SwapPreference className="mt-3" />

          {/* Equals this many cars. */}
          <p className="mt-1 flex items-baseline gap-2 px-1.5">
            <span aria-hidden className="font-display text-2xl leading-none font-extrabold">
              =
            </span>
            <span className="font-display text-[2rem] leading-none font-extrabold tracking-tight text-accent-strong sm:text-4xl">
              <AnimatedNumber value={swaps.length} /> {carsWord(swaps.length)}
            </span>
          </p>

          <Fan
            cards={fan}
            emptyText={direction === "down" ? copy.landing.equationEmptyDown : copy.landing.equationEmpty}
          />

          <Link
            href="/swipe"
            transitionTypes={["nav-forward"]}
            className={buttonClass({ size: "lg", className: "mt-5 w-full lg:hidden" })}
          >
            {copy.landing.cta}
            <ArrowRight className="size-5" aria-hidden />
          </Link>
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
function Fan({ cards, emptyText }: { cards: DeckCard[]; emptyText: string }) {
  const reduceMotion = useReducedMotion();
  const count = cards.length;
  // `cards` is cheapest first; rank 0 is the most car for the money.
  const ranked = [...cards].reverse();

  return (
    <div className="relative mt-6 h-[8.25rem] [--step:2.1rem] min-[26rem]:[--step:2.7rem] sm:h-[9.75rem] sm:[--step:3.4rem] xl:h-[11.75rem] xl:[--step:4.5rem]">
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
              className="absolute top-0 -ml-[4.75rem] w-[9.5rem] sm:-ml-[5.75rem] sm:w-[11.5rem] xl:-ml-[7rem] xl:w-[14rem]"
              style={{ left: `calc(50% + var(--step) * ${slot})`, zIndex: 10 - distance }}
              initial={{ opacity: 0, y: 40, scale: 0.7, rotate: slot * 6 }}
              animate={{ opacity: 1, ...pose }}
              exit={{ opacity: 0, y: 40, scale: 0.7 }}
              transition={reduceMotion ? { duration: 0 } : springs.settle}
            >
              <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-raised dark-surface shadow-float ring-2 ring-surface">
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
                      {display.kind === "top-up"
                        ? `+ ${display.value}`
                        : display.kind === "cash-back"
                          ? copy.deal.cashBackShort(display.value)
                          : display.value}
                    </p>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-white/35" />
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {count === 0 ? (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-fg-muted">
          {emptyText}
        </p>
      ) : null}
    </div>
  );
}
