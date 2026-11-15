import Image from "next/image";
import { CarChip } from "@/components/ui/CarChip";
import { cn } from "@/lib/cn";
import { copy, fuelLabel, gearboxLabel } from "@/lib/copy";
import { allIn, typicalRegistration } from "@/lib/cost-display";
import { describeDeal, dealTone, type DealDisplay } from "@/lib/deal-display";
import type { DeckCard } from "@/lib/domain/deck";
import type { UserCar } from "@/lib/domain/types";
import { formatEur, formatKm } from "@/lib/format";
import { displayAspect } from "@/lib/photo";

interface CarCardProps {
  card: DeckCard;
  car: UserCar | null;
  /** The card on top of the deck: its photo is fetched ahead of the ones waiting beneath it. */
  priority?: boolean;
  /**
   * For a card shown outside the deck screen, e.g. far down a page: fetch the
   * photo when it is about to be seen, and give the name a heading level that
   * fits where the card sits.
   */
  embedded?: boolean;
}

/**
 * The face of a swipe card: the photo on top, the facts and the deal in ink
 * on white below.
 *
 * Car photos are landscape and the card is portrait, so the photo area takes
 * whatever height the text leaves. The picture sits at the bottom of that
 * area at its own proportions, and a blurred copy of it carries the sky on
 * above, so the whole car stays in view on any screen.
 */
export function CarCard({ card, car, priority = false, embedded = false }: CarCardProps) {
  const { listing, dealer, deal } = card;
  const Title = embedded ? "h4" : "h2";
  const display = describeDeal(deal, listing);
  const specs = [String(listing.year), formatKm(listing.km), fuelLabel[listing.fuel], gearboxLabel[listing.gearbox]];

  return (
    <article className="flex size-full flex-col overflow-hidden rounded-card bg-surface shadow-card ring-1 ring-line select-none">
      <div className="relative min-h-0 flex-1 overflow-hidden bg-surface">
        <div className="absolute inset-x-0 bottom-0" style={{ aspectRatio: displayAspect(listing.photo) }}>
          <Backdrop src={listing.photo.blur} />
          <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_18%)]">
            <Image
              src={listing.photo.src}
              alt={`${listing.make} ${listing.model}, ${listing.color}`}
              fill
              sizes="(max-width: 30rem) 100vw, 28rem"
              loading={embedded ? "lazy" : "eager"}
              fetchPriority={priority ? "high" : "auto"}
              draggable={false}
              className="pointer-events-none object-cover"
            />
          </div>
        </div>

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className={cn(label, "max-w-[62%] truncate text-chip-ink")}>
            {dealer.name}
            <span className="font-medium text-chip-ink/60"> · {dealer.area}</span>
          </span>
          {display.flag ? <Flag flag={display.flag} /> : null}
        </div>
      </div>

      <div className="shrink-0 p-5 pt-4 short:p-4 short:pt-3.5">
        <Title className="font-display text-[1.75rem] leading-none font-bold tracking-tight text-balance short:text-2xl short:leading-none">
          {listing.make} {listing.model}
        </Title>
        <p className="mt-1.5 truncate text-sm text-fg-muted">{listing.variant}</p>

        {/* Chips where there is room. On a short screen they can wrap to a second
            row and squeeze the photo, so there the same facts go on one line. */}
        <ul className="mt-3 flex flex-wrap gap-1.5 short:hidden">
          {specs.map((spec) => (
            <li key={spec} className="rounded-full bg-raised px-2.5 py-1 text-[13px] font-medium tabular-nums">
              {spec}
            </li>
          ))}
        </ul>
        <p className="mt-1 hidden truncate text-sm font-medium tabular-nums short:block">{specs.join(" · ")}</p>

        <DealPanel card={card} display={display} car={car} />
      </div>
    </article>
  );
}

/** White labels that stay readable on any photo. */
const label = "rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold shadow-chip ring-1 ring-black/[0.06]";

/**
 * Lets the picture rise out of the white card instead of starting on a hard
 * edge. A blurred copy sits behind it; above, the blur's first row is mirrored
 * and stretched upwards, then fades to white within a few lines of text. On a
 * tall card that leaves clean white under the labels; on a short one the photo
 * simply reaches the top.
 */
function Backdrop({ src }: { src: string }) {
  const image = { backgroundImage: `url(${src})` };
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-size-[100%_100%]" style={image} />
      <div className="absolute inset-x-0 bottom-full h-[220%]">
        <div className="absolute inset-0 -scale-y-100 bg-size-[100%_1400%] bg-top" style={image} />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,transparent,rgb(255_255_255/0.85)_2.5rem,white_5.5rem)]" />
      </div>
    </div>
  );
}

function Flag({ flag }: { flag: NonNullable<DealDisplay["flag"]> }) {
  return (
    <span
      className={cn(
        label,
        "flex shrink-0 items-center gap-1.5",
        flag.tone === "ok" && "text-chip-ink",
        flag.tone === "warn" && "text-warn",
        flag.tone === "muted" && "text-fg-muted",
      )}
    >
      {flag.tone === "ok" ? <span aria-hidden className="size-1.5 rounded-full bg-accent" /> : null}
      {flag.text}
    </span>
  );
}

/**
 * The equation on every card: your car, plus this much, is this car. Under it,
 * the two figures an ad never shows: everything included on the day, and what
 * the car then costs to keep registered.
 */
function DealPanel({ card, display, car }: { card: DeckCard; display: DealDisplay; car: UserCar | null }) {
  const { listing, deal, costs } = card;
  const showsSwap = display.kind !== "price" && car !== null;

  return (
    <div className="mt-4 rounded-3xl bg-raised p-4 short:mt-3 short:p-3.5">
      <div className="flex items-end justify-between gap-3">
        <DealFigure display={display} car={car} showsSwap={showsSwap} price={listing.priceEur} />
      </div>
      <CostCaption deal={deal} costs={costs} />
    </div>
  );
}

function CostCaption({ deal, costs }: Pick<DeckCard, "deal" | "costs">) {
  const total = allIn(deal, costs);
  const registration = formatEur(typicalRegistration(costs));

  // Without a swap to total up, the one fixed cost worth a line is the tax.
  const first = total
    ? {
        label: total.receives ? copy.costs.inHand : copy.costs.total,
        value: copy.costs.approx(formatEur(total.amount)),
      }
    : {
        label: copy.costs.transferTax,
        value: costs.transferTax === 0 ? formatEur(0) : copy.costs.approx(formatEur(costs.transferTax)),
      };

  return (
    <p className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-t border-line pt-2.5 text-[13px] text-fg-muted tabular-nums short:mt-2.5 short:pt-2">
      <span>
        {first.label} <span className="font-semibold text-fg">{first.value}</span>
      </span>
      <span>
        <span aria-hidden>
          {copy.costs.registrationShort}{" "}
          <span className="font-semibold text-fg">{copy.costs.approx(registration)}</span>
          {copy.costs.perYearShort}
        </span>
        <span className="sr-only">
          {copy.costs.registration} {copy.costs.about(registration)} {copy.costs.perYear}
        </span>
      </span>
    </p>
  );
}

function DealFigure({
  display,
  car,
  showsSwap,
  price,
}: {
  display: DealDisplay;
  car: UserCar | null;
  showsSwap: boolean;
  price: number;
}) {
  return (
    <>
      <div className="min-w-0">
        {showsSwap && car ? (
          <div className="flex items-center gap-2 text-sm font-medium text-fg-muted">
            <CarChip className="text-[0.8rem]">{car.model}</CarChip>
            {display.kind === "top-up" ? <span className="text-xl leading-none font-semibold text-fg">+</span> : null}
            {display.kind === "even" ? <span className="text-xl leading-none font-semibold text-fg">=</span> : null}
            {display.kind === "cash-back" ? <span>{copy.deal.cashBackSuffix}</span> : null}
          </div>
        ) : (
          <div className="text-xs font-semibold tracking-wider text-fg-faint uppercase">{copy.deal.price}</div>
        )}
        <div
          className={cn(
            "mt-1.5 font-display leading-none font-bold tracking-tight tabular-nums",
            display.kind === "even" ? "text-[1.7rem] short:text-2xl" : "text-[2.1rem] short:text-[1.85rem]",
            dealTone(display),
          )}
        >
          {display.value}
        </div>
      </div>

      {showsSwap ? (
        <div className="shrink-0 text-right">
          <div className="text-[11px] font-semibold tracking-wider text-fg-faint uppercase">{copy.deal.priceLower}</div>
          <div className="mt-0.5 text-[15px] font-semibold tabular-nums">{formatEur(price)}</div>
        </div>
      ) : display.kind === "price" && car === null ? (
        <p className="max-w-[45%] shrink-0 text-right text-xs leading-snug text-fg-muted">{copy.deal.addCarHint}</p>
      ) : null}
    </>
  );
}
