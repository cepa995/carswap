"use client";

import { Heart, X } from "lucide-react";
import Image from "next/image";
import { GALLERY_PHOTO_SIZES } from "@/components/garage/Parking";
import { cn } from "@/lib/cn";
import { copy, fuelLabel, gearboxLabel } from "@/lib/copy";
import type { DeckCard } from "@/lib/domain/deck";
import type { UserCar } from "@/lib/domain/types";
import { formatKm } from "@/lib/format";
import { listingName } from "@/lib/share";
import { CostCaption, DealSummary, PhotoLabels } from "./CarCard";

interface GalleryCardProps {
  card: DeckCard;
  car: UserCar | null;
  /** Among the first on screen: fetch its photo straight away. */
  priority?: boolean;
  /** Just the photo, the name, the deal and the two buttons, for a card shown small. */
  compact?: boolean;
  /** Heading level of the car's name, to fit wherever the card is shown. */
  heading?: "h2" | "h3" | "h4";
  /** Receives the photo's element, which is where a liked car's flight to the garage starts. */
  photoRef?: (element: HTMLElement | null) => void;
  /** Opens the car's details. Without it the photo is not a button. */
  onOpen?: () => void;
  onPass: () => void;
  onLike: () => void;
}

/**
 * A car as it hangs in the gallery on a big screen. The same facts as a swipe
 * card, in a shape that sits in a grid, with the two decisions as buttons:
 * there is no card to throw here, and a mouse is better at clicking.
 */
export function GalleryCard({
  card,
  car,
  priority = false,
  compact = false,
  heading: Heading = "h2",
  photoRef,
  onOpen,
  onPass,
  onLike,
}: GalleryCardProps) {
  const { listing } = card;
  const name = listingName(listing);
  const specs = [String(listing.year), formatKm(listing.km), fuelLabel[listing.fuel], gearboxLabel[listing.gearbox]];

  const photo = (
    <>
      <Image
        src={listing.photo.src}
        alt={onOpen ? "" : `${name}, ${listing.color}`}
        fill
        sizes={GALLERY_PHOTO_SIZES}
        loading={priority ? "eager" : "lazy"}
        draggable={false}
        className="object-cover transition duration-500 ease-out-expo group-hover/photo:scale-[1.04]"
      />
      <PhotoLabels card={card} />
    </>
  );
  const frame = "group/photo relative block aspect-[3/2] w-full overflow-hidden bg-raised";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-surface shadow-float ring-1 ring-line transition-shadow duration-300 hover:shadow-card">
      {onOpen ? (
        <button
          ref={photoRef}
          type="button"
          onClick={onOpen}
          aria-label={`${name}: ${copy.gallery.details}`}
          className={cn(frame, "cursor-pointer text-left")}
        >
          {photo}
        </button>
      ) : (
        <div ref={photoRef} className={frame}>
          {photo}
        </div>
      )}

      <div className={cn("flex flex-1 flex-col", compact ? "p-3.5" : "p-4")}>
        <Heading className="font-display text-xl leading-tight font-bold tracking-tight">{name}</Heading>
        {compact ? null : (
          <>
            <p className="mt-0.5 truncate text-sm text-fg-muted">{listing.variant}</p>
            <p className="mt-1.5 truncate text-sm font-medium tabular-nums">{specs.join(" · ")}</p>
          </>
        )}

        <div className={cn("rounded-2xl bg-raised", compact ? "mt-2.5 p-3" : "mt-3 p-3.5")}>
          <DealSummary card={card} car={car} />
          {compact ? null : <CostCaption deal={card.deal} costs={card.costs} />}
        </div>

        {/* Pushed to the bottom, so the buttons line up across a row of cards. */}
        <div className="mt-auto flex gap-2 pt-3">
          <button
            type="button"
            onClick={onPass}
            aria-label={`${copy.deck.pass}: ${name}`}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-surface text-sm font-semibold ring-1 ring-line-strong transition duration-150 ease-out-expo ring-inset hover:bg-raised active:scale-[0.97]"
          >
            <X className="size-4" strokeWidth={3} aria-hidden />
            {copy.deck.pass}
          </button>
          <button
            type="button"
            onClick={onLike}
            aria-label={`${copy.deck.like}: ${name}`}
            className="flex h-11 flex-[1.4] items-center justify-center gap-1.5 rounded-full bg-accent text-sm font-semibold text-on-accent shadow-accent transition duration-150 ease-out-expo hover:bg-accent-strong active:scale-[0.97]"
          >
            <Heart className="size-4 fill-current" strokeWidth={2} aria-hidden />
            {copy.deck.like}
          </button>
        </div>
      </div>
    </article>
  );
}
