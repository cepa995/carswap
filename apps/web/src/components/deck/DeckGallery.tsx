"use client";

import { ChevronDown, Undo2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { SwapPreference } from "@/components/car/SwapPreference";
import { GaragePanel } from "@/components/garage/GaragePanel";
import { useParking } from "@/components/garage/Parking";
import { Button } from "@/components/ui/Button";
import { CarChip } from "@/components/ui/CarChip";
import { track } from "@/lib/analytics";
import { brand } from "@/lib/brand";
import { copy } from "@/lib/copy";
import type { DeckCard } from "@/lib/domain/deck";
import { carsCount } from "@/lib/format";
import { springs } from "@/lib/motion";
import { AddCarButton } from "./DeckPhone";
import { DetailsSheet } from "./DetailsSheet";
import { EmptyDeck } from "./EmptyDeck";
import { GalleryCard } from "./GalleryCard";
import { Toast } from "./Toast";
import type { DeckSession } from "./useDeckSession";

/** Once the car has reached its bay, a beat before the first match takes over the screen. */
const CELEBRATE_AFTER_MS = 950;

/**
 * The deck on a big screen: a gallery. There is room to see many cars at
 * once and a mouse to point with, so nothing is swiped. "Menjam" parks a car
 * in the garage, which stands beside the gallery and fills up in plain view;
 * "Dalje" takes it off the wall.
 */
export function DeckGallery({ session }: { session: DeckSession }) {
  const { car, cards, allCards, parked, canUndo, decide, undo } = session;
  const reduceMotion = useReducedMotion() ?? false;
  const parking = useParking();

  /** Each car's photo on the wall, which is where its flight to the garage starts. */
  const photos = useRef(new Map<string, HTMLElement>());
  /** The car whose details are open, and whether it was opened from the wall or from the garage. */
  const [details, setDetails] = useState<{ id: string; parked: boolean } | null>(null);
  const shown = details ? (allCards.find((card) => card.listing.id === details.id) ?? null) : null;
  const overlayOpen = details !== null || session.carSheetOpen || session.match !== null;

  const like = useCallback(
    (card: DeckCard) => {
      const { id, photo } = card.listing;
      parking.park(id, photos.current.get(id), photo.src);
      decide(card, "like", "button", { celebrateAfterMs: CELEBRATE_AFTER_MS });
    },
    [parking, decide],
  );

  function open(card: DeckCard, fromGarage: boolean) {
    setDetails({ id: card.listing.id, parked: fromGarage });
    track("card_details_opened", { listingId: card.listing.id });
  }

  function openCarSheet(source: "deck" | "details") {
    setDetails(null);
    session.openCarSheet(source);
  }

  // Z takes the last decision back, as on the phone.
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
      if (event.key !== "z" && event.key !== "Z") return;
      undo();
      event.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [overlayOpen, undo]);

  return (
    <div className="relative isolate min-h-dvh">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 ambient" />
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 grain opacity-[0.05]" />

      {/* Stays put while the gallery scrolls: the choice that decides what hangs on the wall. */}
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-[4.75rem] max-w-[120rem] items-center gap-4 px-6 xl:gap-6 xl:px-10">
          <Link
            href="/"
            transitionTypes={["nav-back"]}
            aria-label={copy.nav.home}
            className="flex shrink-0 items-center gap-2.5"
          >
            <Wordmark />
            {brand.isDemo ? (
              <span className="rounded-full bg-raised px-2 py-0.5 text-[10px] font-semibold tracking-wider text-fg-faint uppercase ring-1 ring-line ring-inset">
                {copy.common.demoBadge}
              </span>
            ) : null}
          </Link>

          {car ? (
            <>
              <button
                type="button"
                onClick={() => openCarSheet("deck")}
                aria-label={`${copy.car.yours}: ${car.make} ${car.model}, ${car.year}. ${copy.car.edit}`}
                className="shrink-0 rounded-full transition duration-150 ease-out-expo active:scale-[0.97]"
              >
                <CarChip
                  className="text-base"
                  trailing={<ChevronDown className="-mr-[0.25em] size-[1.05em] shrink-0 text-fg-faint" aria-hidden />}
                >
                  {car.model} · {car.year}
                </CarChip>
              </button>
              <SwapPreference layout="bar" className="max-w-[46rem] min-w-0 flex-1" />
            </>
          ) : (
            <>
              <AddCarButton onClick={() => openCarSheet("deck")} />
              <p className="min-w-0 flex-1 truncate text-[15px] text-fg-muted">{copy.deck.emptyBodyNoCar}</p>
            </>
          )}

          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="ml-auto flex h-10 shrink-0 items-center gap-2 rounded-full bg-surface px-3 text-sm font-semibold shadow-chip ring-1 ring-line transition duration-150 ease-out-expo hover:bg-raised active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 xl:px-4"
          >
            <Undo2 className="size-4" strokeWidth={2.4} aria-hidden />
            {/* The words go where there is room for them; the button keeps its name either way. */}
            <span className="max-xl:sr-only">{copy.deck.undo}</span>
            <kbd className="hidden rounded-md bg-raised px-1.5 font-sans text-[11px] font-semibold text-fg-muted ring-1 ring-line-strong xl:block">
              Z
            </kbd>
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[120rem] grid-cols-[minmax(0,1fr)_20rem] items-start gap-7 px-6 pt-7 pb-16 xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-8 xl:px-10 2xl:grid-cols-[minmax(0,1fr)_23rem]">
        <main>
          <div className="mb-5 flex items-baseline gap-3">
            <h1 className="font-display text-[2.1rem] leading-none font-extrabold tracking-tight">
              {car ? copy.gallery.titleCar : copy.gallery.titleNoCar}
            </h1>
            <p className="text-fg-muted tabular-nums">{carsCount(cards.length)}</p>
          </div>

          {cards.length > 0 ? (
            // As many columns as fit, none narrower than a card needs to show its deal on one line.
            <ul className="relative grid grid-cols-[repeat(auto-fill,minmax(18.5rem,1fr))] gap-5">
              <AnimatePresence initial={false} mode="popLayout">
                {cards.map((card, index) => (
                  <motion.li
                    key={card.listing.id}
                    layout={reduceMotion ? false : "position"}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={reduceMotion ? { duration: 0 } : springs.settle}
                  >
                    <GalleryCard
                      card={card}
                      car={car}
                      priority={index < 8}
                      photoRef={(element) => {
                        if (element) photos.current.set(card.listing.id, element);
                        else photos.current.delete(card.listing.id);
                      }}
                      onOpen={() => open(card, false)}
                      onPass={() => decide(card, "pass", "button")}
                      onLike={() => like(card)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          ) : (
            <EmptyDeck
              className="mx-auto h-[30rem] max-w-xl"
              hasCar={car !== null}
              direction={session.direction}
              suggestion={session.wayOut?.suggestion ?? null}
              otherDirection={session.wayOut?.otherDirection ?? 0}
              hasPassed={session.hasPassed}
              likedCount={session.likedCount}
              onBudget={session.setBudget}
              onMinCash={session.setMinCash}
              onAnyDirection={() => session.setDirection("any")}
              onRestore={session.restorePassed}
              onAddCar={() => openCarSheet("deck")}
            />
          )}
        </main>

        {/* In view however far the gallery has scrolled, so a parked car always has somewhere to go. */}
        <GaragePanel
          className="sticky top-[6.5rem] max-h-[calc(100dvh-8rem)]"
          parked={parked}
          carModel={car?.model ?? null}
          arriving={parking.arriving}
          onOpen={(card) => open(card, true)}
          onRemove={session.removeFromGarage}
        />
      </div>

      <Toast message={session.toast} className="fixed inset-x-0 top-[5.75rem]" />
      {parking.flights}

      <DetailsSheet
        card={shown}
        car={car}
        onClose={() => setDetails(null)}
        onAddCar={() => openCarSheet("details")}
        actions={
          details?.parked ? (
            <>
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => {
                  if (shown) session.removeFromGarage(shown);
                  setDetails(null);
                }}
              >
                {copy.garage.remove}
              </Button>
              <Button size="lg" className="flex-1" onClick={() => setDetails(null)}>
                {copy.common.done}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => {
                  if (shown) decide(shown, "pass", "button");
                  setDetails(null);
                }}
              >
                {copy.deck.pass}
              </Button>
              <Button
                size="lg"
                className="flex-[1.4]"
                onClick={() => {
                  if (shown) like(shown);
                  setDetails(null);
                }}
              >
                {copy.deck.like}
              </Button>
            </>
          )
        }
      />
    </div>
  );
}
