"use client";

import { Warehouse, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { dealLine, dealTone, describeDeal } from "@/lib/deal-display";
import type { DeckCard } from "@/lib/domain/deck";
import { springs } from "@/lib/motion";
import { listingName } from "@/lib/share";

interface BaysProps {
  /** Parked cars, in the order they were parked: a new one takes the next free bay. */
  parked: readonly DeckCard[];
  /** The visitor's car model, for the deal under each parked car. */
  carModel: string | null;
  /** Cars still on their way over: their bay is taken but its picture waits for them. */
  arriving: ReadonlySet<string>;
  /** How many bays to draw, taken and free together. Never fewer than there are parked cars. */
  bays: number;
  /** Bays in a row. */
  columns?: 2 | 3;
  /** Under each parked car, its name and deal. Off where the bays are too small to read them. */
  labels?: boolean;
  onOpen?: (card: DeckCard) => void;
  onRemove?: (card: DeckCard) => void;
}

/**
 * The bays of a garage: each parked car in its own, and dashed outlines
 * marked "P" for the ones still free. A car in flight aims for the picture
 * frame marked `data-bay`.
 */
export function Bays({ parked, carModel, arriving, bays, columns = 2, labels = true, onOpen, onRemove }: BaysProps) {
  const free = Math.max(0, bays - parked.length);

  return (
    <ul className={cn("grid gap-2.5", columns === 3 ? "grid-cols-3" : "grid-cols-2")}>
      <AnimatePresence initial={false} mode="popLayout">
        {parked.map((card) => {
          const { listing } = card;
          const name = listingName(listing);
          const display = describeDeal(card.deal, listing);
          const landing = arriving.has(listing.id);
          const body = (
            <>
              <span
                data-bay={listing.id}
                className="relative block aspect-[3/2] overflow-hidden rounded-xl bg-hover ring-1 ring-line ring-inset"
              >
                <Image
                  src={listing.photo.src}
                  alt=""
                  fill
                  sizes="12rem"
                  className={cn("object-cover transition-opacity duration-150", landing && "opacity-0")}
                />
              </span>
              {labels ? (
                <>
                  <span className="mt-1.5 block truncate px-1 text-[13px] leading-tight font-semibold">{name}</span>
                  <span
                    className={cn(
                      "block truncate px-1 pb-0.5 font-display text-[13px] leading-tight font-bold tabular-nums",
                      dealTone(display),
                    )}
                  >
                    {dealLine(display, carModel)}
                  </span>
                </>
              ) : null}
            </>
          );

          return (
            <motion.li
              key={listing.id}
              layout
              className="group relative rounded-2xl bg-surface p-1.5 shadow-chip ring-1 ring-line"
              initial={{ opacity: 0 }}
              // Settles into the bay as the car lands, like a car rocking on its springs.
              animate={{ opacity: 1, scale: landing ? 0.94 : 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={springs.bouncy}
            >
              {onOpen ? (
                <button type="button" onClick={() => onOpen(card)} className="block w-full cursor-pointer text-left">
                  {body}
                </button>
              ) : (
                body
              )}
              {onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(card)}
                  aria-label={`${copy.garage.remove}: ${name}`}
                  className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-white/90 text-chip-ink opacity-0 shadow-chip ring-1 ring-black/10 transition duration-150 group-hover:opacity-100 hover:bg-white focus-visible:opacity-100"
                >
                  <X className="size-3.5" strokeWidth={3} aria-hidden />
                </button>
              ) : null}
            </motion.li>
          );
        })}

        {Array.from({ length: free }, (_, index) => (
          <motion.li key={`free-${index}`} layout aria-hidden className="p-1.5">
            <span className="flex aspect-[3/2] items-center justify-center rounded-xl border-2 border-dashed border-line-strong font-display text-2xl font-extrabold text-fg-faint/60">
              {copy.gallery.bay}
            </span>
            {/* As tall as the two lines under a parked car, so free and taken bays line up. */}
            {labels ? <span className="mt-1.5 block h-[2.2rem]" /> : null}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

interface GaragePanelProps extends Omit<BaysProps, "bays" | "columns" | "labels"> {
  className?: string;
}

/** Never fewer than this many bays, so the garage looks like one even when empty. */
const FEWEST_BAYS = 6;

/**
 * The garage, beside the gallery on a big screen. Cars the visitor likes are
 * parked here in plain sight, so the garage fills up as they go instead of
 * being a number on a button.
 */
export function GaragePanel({ parked, className, ...rest }: GaragePanelProps) {
  // Whole rows of two, and always a free bay for the next car.
  const bays = Math.max(FEWEST_BAYS, Math.ceil((parked.length + 1) / 2) * 2);

  return (
    <aside
      aria-label={copy.nav.garage}
      className={cn("flex min-h-0 flex-col rounded-[2rem] bg-raised/80 p-4 ring-1 ring-line ring-inset", className)}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-1.5">
        <h2 className="flex items-center gap-2.5 font-display text-2xl leading-none font-bold tracking-tight">
          <Warehouse className="size-6 text-accent-strong" aria-hidden />
          {copy.nav.garage}
        </h2>
        <motion.span
          key={parked.length}
          initial={{ scale: 1.6 }}
          animate={{ scale: 1 }}
          transition={springs.bouncy}
          aria-label={copy.garage.saved(parked.length)}
          className={cn(
            "flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-bold tabular-nums",
            parked.length > 0 ? "bg-accent text-on-accent" : "bg-hover text-fg-muted",
          )}
        >
          {parked.length}
        </motion.span>
      </div>
      <p className="mt-1.5 shrink-0 px-1.5 text-sm text-fg-muted">
        {parked.length === 0 ? copy.gallery.garageEmpty : copy.gallery.garageSome}
      </p>

      <div className="-mx-1 mt-3 no-scrollbar min-h-0 flex-1 overflow-y-auto px-1 pb-1">
        <Bays parked={parked} bays={bays} {...rest} />
      </div>

      <Link
        href="/garage"
        transitionTypes={["nav-forward"]}
        className={buttonClass({ variant: "secondary", className: "mt-3 shrink-0 bg-surface" })}
      >
        {copy.deck.openGarage}
      </Link>
    </aside>
  );
}
