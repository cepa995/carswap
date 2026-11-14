"use client";

import { ChevronLeft, Trash2, Warehouse } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { browser } from "react-dom";
import { MyCarSheet } from "@/components/car/MyCarSheet";
import { DetailsSheet } from "@/components/deck/DetailsSheet";
import { Button, buttonClass } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { track } from "@/lib/analytics";
import { brand } from "@/lib/brand";
import { useCurrentYear } from "@/lib/clock";
import { cn } from "@/lib/cn";
import { copy, fuelLabel } from "@/lib/copy";
import { describeDeal, type DealDisplay } from "@/lib/deal-display";
import { buildCards, type DeckCard } from "@/lib/domain/deck";
import { formatKm } from "@/lib/format";
import { springs } from "@/lib/motion";
import { dealers, listings } from "@/lib/seed";
import { likedIds, useApp } from "@/lib/store";
import { useEstimate } from "@/lib/useEstimate";

/** Smallest top-up first; cars without swap maths go last. */
function topUpOrder(card: DeckCard): number {
  return card.deal.status === "swap" || card.deal.status === "over-budget" ? card.deal.topUp : Number.POSITIVE_INFINITY;
}

export function GarageScreen() {
  use(browser("The garage lists cars saved in localStorage."));

  const currentYear = useCurrentYear();
  const car = useApp((state) => state.car);
  const budget = useApp((state) => state.budget);
  const swipes = useApp((state) => state.swipes);
  const history = useApp((state) => state.history);
  const removeFromGarage = useApp((state) => state.removeFromGarage);

  const estimate = useEstimate(car);
  const saved = useMemo(() => {
    const byId = new Map(
      buildCards({ listings, dealers, car, estimate, budget, currentYear }).map((card) => [card.listing.id, card]),
    );
    return likedIds({ swipes, history })
      .flatMap((id) => byId.get(id) ?? [])
      .sort((a, b) => topUpOrder(a) - topUpOrder(b));
  }, [car, estimate, budget, swipes, history, currentYear]);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [carSheetOpen, setCarSheetOpen] = useState(false);
  const details = detailsId ? (saved.find((card) => card.listing.id === detailsId) ?? null) : null;

  useEffect(() => {
    track("garage_viewed", { saved: saved.length });
    // Once per visit to the screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function remove(listingId: string) {
    removeFromGarage(listingId);
    track("garage_item_removed", { listingId });
  }

  return (
    <div className="relative isolate flex min-h-dvh flex-col" style={{ "--glow": "#2b4ba8" } as React.CSSProperties}>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 ambient" />

      <div className="mx-auto flex w-full max-w-[30rem] flex-1 flex-col px-5 pb-10">
        <header className="box-content flex h-14 shrink-0 items-center justify-between pt-safe">
          <Link
            href="/swipe"
            transitionTypes={["nav-back"]}
            className="-ml-2 flex h-10 items-center gap-1 rounded-full pr-3.5 pl-2 text-sm font-semibold text-fg-muted hover:bg-raised hover:text-fg"
          >
            <ChevronLeft className="size-5" aria-hidden />
            {copy.nav.deck}
          </Link>
          {car ? (
            <button
              type="button"
              onClick={() => setCarSheetOpen(true)}
              aria-label={`${copy.car.yours}. ${copy.car.edit}`}
            >
              <Plate className="text-[0.85rem]">
                {car.model} · {car.year}
              </Plate>
            </button>
          ) : null}
        </header>

        <div className="mt-4 flex items-end justify-between">
          <h1 className="font-display text-5xl leading-none font-extrabold tracking-tight">{copy.garage.title}</h1>
          {saved.length > 0 ? <p className="pb-1 text-sm text-fg-muted">{copy.garage.saved(saved.length)}</p> : null}
        </div>

        {saved.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <span className="flex size-20 items-center justify-center rounded-[1.75rem] bg-raised text-sky ring-1 ring-line-strong ring-inset">
              <Warehouse className="size-10" aria-hidden />
            </span>
            <h2 className="mt-6 font-display text-3xl font-bold tracking-tight">{copy.garage.emptyTitle}</h2>
            <p className="mt-2 max-w-xs text-[15px] text-pretty text-fg-muted">{copy.garage.emptyBody}</p>
            <Link
              href="/swipe"
              transitionTypes={["nav-back"]}
              className={buttonClass({ size: "lg", className: "mt-7" })}
            >
              {copy.garage.startSwiping}
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-6 flex flex-col gap-3">
              <AnimatePresence initial={false} mode="popLayout">
                {saved.map((card) => (
                  <motion.li
                    key={card.listing.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, scale: 0.96 }}
                    transition={springs.settle}
                  >
                    <GarageItem
                      card={card}
                      carModel={car?.model ?? null}
                      onOpen={() => setDetailsId(card.listing.id)}
                      onRemove={() => remove(card.listing.id)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            <div className="mt-6 rounded-3xl bg-raised/70 p-5 ring-1 ring-line ring-inset">
              <p className="text-xs font-semibold tracking-wider text-fg-faint uppercase">{copy.garage.nextTitle}</p>
              <p className="mt-1.5 text-[15px] text-fg-muted">{copy.garage.nextBody}</p>
            </div>

            <Link
              href="/swipe"
              transitionTypes={["nav-back"]}
              className={buttonClass({ variant: "secondary", size: "lg", className: "mt-4" })}
            >
              {copy.garage.keepSwiping}
            </Link>
          </>
        )}

        {brand.isDemo ? <p className="mt-8 text-center text-xs text-fg-faint">{copy.common.demoNote}</p> : null}
      </div>

      <DetailsSheet
        card={details}
        car={car}
        onClose={() => setDetailsId(null)}
        onAddCar={() => {
          setDetailsId(null);
          setCarSheetOpen(true);
          track("car_flow_opened", { source: "garage" });
        }}
        actions={
          <>
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => {
                if (detailsId) remove(detailsId);
                setDetailsId(null);
              }}
            >
              {copy.garage.remove}
            </Button>
            <Button size="lg" className="flex-1" onClick={() => setDetailsId(null)}>
              {copy.common.done}
            </Button>
          </>
        }
      />

      <MyCarSheet open={carSheetOpen} onOpenChange={setCarSheetOpen} />
    </div>
  );
}

function GarageItem({
  card,
  carModel,
  onOpen,
  onRemove,
}: {
  card: DeckCard;
  carModel: string | null;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const { listing, dealer, deal } = card;
  const display = describeDeal(deal, listing);

  return (
    <div className="relative flex overflow-hidden rounded-3xl bg-surface ring-1 ring-line ring-inset">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-stretch gap-4 p-2.5 text-left hover:bg-raised/60"
      >
        <span className="relative aspect-[3/2] w-[7.75rem] shrink-0 self-center overflow-hidden rounded-2xl bg-raised">
          <Image
            src={listing.photo.src}
            alt={`${listing.make} ${listing.model}, ${listing.color}`}
            fill
            sizes="8rem"
            className="object-cover"
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col justify-center py-0.5 pr-1">
          <span className="truncate pr-9 font-display text-lg leading-tight font-bold tracking-tight">
            {listing.make} {listing.model}
          </span>
          <span className="truncate text-[13px] text-fg-muted">
            {listing.year} · {formatKm(listing.km)} · {fuelLabel[listing.fuel]}
          </span>
          <DealChip display={display} carModel={carModel} />
          <span className="mt-1 truncate text-xs text-fg-faint">
            {dealer.name} · {dealer.area}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${copy.garage.remove}: ${listing.make} ${listing.model}`}
        className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-full text-fg-faint hover:bg-hover hover:text-accent-soft"
      >
        <Trash2 className="size-[1.05rem]" aria-hidden />
      </button>
    </div>
  );
}

function DealChip({ display, carModel }: { display: DealDisplay; carModel: string | null }) {
  const swap = display.kind !== "price" && carModel !== null;
  return (
    <span className="mt-1.5 flex items-center gap-1.5">
      {swap ? <Plate className="text-[0.62rem]">{carModel}</Plate> : null}
      {swap && display.kind === "top-up" ? <span className="text-sm font-semibold">+</span> : null}
      {swap && display.kind === "cash-back" ? (
        <span className="text-xs text-fg-muted">{copy.deal.cashBackSuffix}</span>
      ) : null}
      <span
        className={cn(
          "font-display text-[1.05rem] leading-none font-bold tracking-tight tabular-nums",
          display.flag?.tone === "warn" ? "text-fg-muted" : "text-fg",
        )}
      >
        {display.value}
      </span>
      {display.flag && display.flag.tone !== "ok" ? (
        <span className={cn("truncate text-xs", display.flag.tone === "warn" ? "text-warn" : "text-fg-faint")}>
          {display.flag.text}
        </span>
      ) : null}
    </span>
  );
}
