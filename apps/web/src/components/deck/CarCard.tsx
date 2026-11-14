import Image from "next/image";
import { Plate } from "@/components/ui/Plate";
import { cn } from "@/lib/cn";
import { copy, fuelLabel, gearboxLabel } from "@/lib/copy";
import { describeDeal, type DealDisplay } from "@/lib/deal-display";
import type { DeckCard } from "@/lib/domain/deck";
import type { UserCar } from "@/lib/domain/types";
import { formatEur, formatKm } from "@/lib/format";
import { displayAspect } from "@/lib/photo";

interface CarCardProps {
  card: DeckCard;
  car: UserCar | null;
  /** The card on top of the deck: its photo is fetched ahead of the ones waiting beneath it. */
  priority?: boolean;
}

/**
 * The face of a swipe card.
 *
 * Car photos are landscape and the card is portrait, so the photo sits above
 * the text and a blurred copy of it fills the rest of the card. The photo's
 * edges are masked into that backdrop, which makes every card feel lit by its
 * own car, and leaves a calm area for the one number that matters.
 */
export function CarCard({ card, car, priority = false }: CarCardProps) {
  const { listing, dealer, deal } = card;
  const display = describeDeal(deal, listing);
  const specs = [String(listing.year), formatKm(listing.km), fuelLabel[listing.fuel], gearboxLabel[listing.gearbox]];

  return (
    <article className="relative flex size-full flex-col justify-end overflow-hidden rounded-card bg-surface shadow-card select-none">
      {/* The photo is anchored to the text below it; on a short card its top is cropped. */}
      <div className="relative -mb-12 w-full shrink-0" style={{ aspectRatio: displayAspect(listing.photo) }}>
        <Backdrop src={listing.photo.blur} />
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_66%,transparent)]">
          <Image
            src={listing.photo.src}
            alt={`${listing.make} ${listing.model}, ${listing.color}`}
            fill
            sizes="(max-width: 30rem) 100vw, 28rem"
            loading="eager"
            fetchPriority={priority ? "high" : "auto"}
            draggable={false}
            className="pointer-events-none object-cover"
          />
        </div>
      </div>
      {/* The backdrop keeps the photo's own brightness, so the two meet without a
          visible edge. These two washes then dim the card as a whole: a soft
          vignette from the top, and a deeper one under the text. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-linear-to-b from-canvas/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[68%] bg-linear-to-t from-canvas/95 via-canvas/75 via-45% to-transparent" />

      <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
        <span className="max-w-[62%] truncate rounded-full bg-canvas/60 px-3 py-1.5 text-xs font-medium ring-1 ring-white/10 ring-inset">
          {dealer.name}
          <span className="text-fg-muted"> · {dealer.area}</span>
        </span>
        {display.flag ? <Flag flag={display.flag} /> : null}
      </div>

      <div className="relative p-5 pt-0">
        <h2 className="font-display text-[2rem] leading-[0.95] font-bold tracking-tight text-balance">
          {listing.make} {listing.model}
        </h2>
        <p className="mt-1.5 truncate text-sm text-fg-muted">{listing.variant}</p>

        <ul className="mt-3 flex flex-wrap gap-1.5">
          {specs.map((spec) => (
            <li key={spec} className="rounded-full bg-white/[0.09] px-2.5 py-1 text-[13px] font-medium tabular-nums">
              {spec}
            </li>
          ))}
        </ul>

        <DealPanel display={display} car={car} price={listing.priceEur} />
      </div>
    </article>
  );
}

/**
 * Fills the card around the photo with the photo's own colours.
 *
 * Behind the photo sits a blurred copy of it. Above and below, the blur's first
 * and last rows are mirrored and stretched, so the sky carries on upwards and
 * the ground downwards, however tall the card is.
 */
function Backdrop({ src }: { src: string }) {
  const image = { backgroundImage: `url(${src})` };
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 brightness-[0.92] saturate-[1.25]">
      <div className="absolute inset-0 bg-size-[100%_100%]" style={image} />
      <div className="absolute inset-x-0 bottom-full h-[220%] -scale-y-100 bg-size-[100%_1400%] bg-top" style={image} />
      <div className="absolute inset-x-0 top-full h-[140%] -scale-y-100 bg-size-[100%_1400%] bg-bottom" style={image} />
    </div>
  );
}

function Flag({ flag }: { flag: NonNullable<DealDisplay["flag"]> }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full bg-canvas/60 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/10 ring-inset",
        flag.tone === "ok" && "text-fg",
        flag.tone === "warn" && "text-warn",
        flag.tone === "muted" && "text-fg-muted",
      )}
    >
      {flag.tone === "ok" ? <span aria-hidden className="size-1.5 rounded-full bg-accent-soft" /> : null}
      {flag.text}
    </span>
  );
}

/** The equation on every card: your car, plus this much, is this car. */
export function DealPanel({
  display,
  car,
  price,
  className,
}: {
  display: DealDisplay;
  car: UserCar | null;
  price: number;
  className?: string;
}) {
  const showsSwap = display.kind !== "price" && car !== null;

  return (
    <div
      className={cn(
        "mt-4 flex items-end justify-between gap-3 rounded-3xl bg-white/[0.07] p-4 ring-1 ring-white/10 ring-inset",
        className,
      )}
    >
      <div className="min-w-0">
        {showsSwap ? (
          <div className="flex items-center gap-2 text-sm font-medium text-fg-muted">
            <Plate className="text-[0.8rem]">{car.model}</Plate>
            {display.kind === "top-up" ? <span className="text-xl leading-none font-semibold text-fg">+</span> : null}
            {display.kind === "even" ? <span className="text-xl leading-none font-semibold text-fg">=</span> : null}
            {display.kind === "cash-back" ? <span>{copy.deal.cashBackSuffix}</span> : null}
          </div>
        ) : (
          <div className="text-xs font-medium tracking-wider text-fg-faint uppercase">{copy.deal.price}</div>
        )}
        <div
          className={cn(
            "mt-1.5 font-display leading-none font-bold tracking-tight tabular-nums",
            display.kind === "even" ? "text-[1.7rem]" : "text-[2.1rem]",
            display.flag?.tone === "warn" ? "text-fg-muted" : "text-fg",
          )}
        >
          {display.value}
        </div>
      </div>

      {showsSwap ? (
        <div className="shrink-0 text-right">
          <div className="text-[11px] font-medium tracking-wider text-fg-faint uppercase">{copy.deal.priceLower}</div>
          <div className="mt-0.5 text-[15px] font-semibold tabular-nums">{formatEur(price)}</div>
        </div>
      ) : display.kind === "price" && car === null ? (
        <p className="max-w-[45%] shrink-0 text-right text-xs leading-snug text-fg-muted">{copy.deal.addCarHint}</p>
      ) : null}
    </div>
  );
}
