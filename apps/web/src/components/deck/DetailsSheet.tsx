"use client";

import { Send } from "lucide-react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { CostBreakdown, DetailRow } from "@/components/car/CostBreakdown";
import { ShareButton } from "@/components/share/ShareButton";
import { CarChip } from "@/components/ui/CarChip";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { bodyLabel, copy, fuelLabel, gearboxLabel } from "@/lib/copy";
import { allIn } from "@/lib/cost-display";
import { dealTone, describeDeal } from "@/lib/deal-display";
import type { DeckCard } from "@/lib/domain/deck";
import type { UserCar } from "@/lib/domain/types";
import { formatEur, formatKm, formatPower } from "@/lib/format";
import { displayAspect } from "@/lib/photo";

interface DetailsSheetProps {
  /** The card to show, or null when closed. */
  card: DeckCard | null;
  car: UserCar | null;
  onClose: () => void;
  onAddCar: () => void;
  /** Pinned to the bottom of the sheet: like / pass in the deck, remove in the garage. */
  actions: ReactNode;
}

export function DetailsSheet({ card, car, onClose, onAddCar, actions }: DetailsSheetProps) {
  // Keep the last card around so the sheet has content while it slides away.
  const [last, setLast] = useState(card);
  if (card && card !== last) setLast(card);
  const shown = card ?? last;

  return (
    <Sheet
      open={card !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={shown ? `${shown.listing.make} ${shown.listing.model}` : copy.deck.details}
      height="tall"
      wide
    >
      {shown ? <Details card={shown} car={car} onAddCar={onAddCar} actions={actions} /> : null}
    </Sheet>
  );
}

function Details({ card, car, onAddCar, actions }: Omit<DetailsSheetProps, "card" | "onClose"> & { card: DeckCard }) {
  const { listing, dealer, deal, costs } = card;
  const display = describeDeal(deal, listing);
  const total = allIn(deal, costs);
  const credit = listing.photo.credit;

  const specs: Array<[string, string]> = [
    [copy.details.year, String(listing.year)],
    [copy.details.km, formatKm(listing.km)],
    [copy.details.fuel, fuelLabel[listing.fuel]],
    [copy.details.gearbox, gearboxLabel[listing.gearbox]],
    [copy.details.power, formatPower(listing.powerKw)],
    [copy.details.body, bodyLabel[listing.body]],
    [copy.details.color, listing.color],
  ];

  const swapLine =
    display.kind === "top-up" || display.kind === "cash-back"
      ? { label: display.kind === "cash-back" ? copy.details.cashBack : copy.details.topUp, value: display.value }
      : null;

  return (
    <>
      {/* A phone reads one column: the car, the swap, the costs, then the rest.
          A big screen has room for two: the car and its facts on the left, the
          money on the right. Each block is written once and placed by its
          `order` on a phone, where the two columns dissolve into one. */}
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-32 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start lg:gap-x-9 lg:px-7 lg:pt-1 lg:pb-28">
        <div className="contents lg:block">
          <div
            className="relative order-1 shrink-0 overflow-hidden rounded-3xl bg-raised"
            style={{ aspectRatio: displayAspect(listing.photo) }}
          >
            <Image
              src={listing.photo.src}
              alt={`${listing.make} ${listing.model}, ${listing.color}`}
              fill
              sizes="(max-width: 30rem) 100vw, 32rem"
              className="object-cover"
            />
            <ShareButton
              card={card}
              car={car}
              source="details"
              className="absolute top-3 right-3 flex h-10 items-center gap-2 rounded-full bg-white/90 pr-4 pl-3.5 text-sm font-semibold text-chip-ink shadow-chip ring-1 ring-black/[0.06] transition duration-150 ease-out-expo hover:bg-white active:scale-[0.97]"
            >
              <Send className="size-4 text-accent-strong" aria-hidden />
              {copy.share.button}
            </ShareButton>
          </div>

          <div className="order-2 mt-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p aria-hidden className="font-display text-[1.75rem] leading-none font-bold tracking-tight">
                {listing.make} {listing.model}
              </p>
              <p className="mt-1.5 text-sm text-fg-muted">{listing.variant}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-medium tracking-wider text-fg-faint uppercase">{copy.deal.price}</p>
              <p className="font-display text-xl font-bold tabular-nums">{formatEur(listing.priceEur)}</p>
            </div>
          </div>

          <Section title={copy.details.specsTitle} className="order-5">
            <dl className="grid grid-cols-2 gap-2">
              {specs.map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-raised px-4 py-3">
                  <dt className="text-xs text-fg-faint">{label}</dt>
                  <dd className="mt-0.5 text-[15px] font-semibold first-letter:uppercase">{value}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title={copy.details.highlightsTitle} className="order-6">
            <ul className="flex flex-wrap gap-2">
              {listing.highlights.map((highlight) => (
                <li key={highlight} className="rounded-full bg-raised px-3.5 py-2 text-sm">
                  {highlight}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <div className="contents lg:block">
          <Section title={copy.details.swapTitle} className="order-3 lg:mt-0">
            {deal.status === "no-car" ? (
              <button
                type="button"
                onClick={onAddCar}
                className="flex w-full items-center justify-between gap-3 rounded-2xl bg-accent/10 p-4 text-left ring-1 ring-accent/30 ring-inset hover:bg-accent/15"
              >
                <span className="text-sm text-fg">{copy.details.noCar}</span>
                <span className="shrink-0 rounded-full bg-accent px-3.5 py-2 text-sm font-semibold text-on-accent">
                  {copy.car.add}
                </span>
              </button>
            ) : deal.status === "not-accepted" ? (
              <p className="rounded-2xl bg-raised p-4 text-sm text-fg-muted">
                {deal.reason === "age"
                  ? copy.details.notAcceptedAge(dealer.rules.maxAgeYears)
                  : copy.details.notAcceptedKm(formatKm(dealer.rules.maxKm))}
              </p>
            ) : (
              <div className="rounded-2xl bg-raised p-4">
                <DetailRow label={copy.details.listingPrice} value={formatEur(listing.priceEur)} />
                <DetailRow
                  label={
                    <span className="flex items-center gap-2">
                      {copy.details.yourCarCredit}
                      {car ? <CarChip className="text-[0.72rem]">{car.model}</CarChip> : null}
                    </span>
                  }
                  value={`− ${formatEur(deal.credit)}`}
                />
                <div className="my-3 h-px bg-line" />
                <DetailRow
                  strong
                  label={display.kind === "cash-back" ? copy.details.cashBack : copy.details.topUp}
                  value={display.value}
                  valueClassName={dealTone(display)}
                />
                {display.flag?.tone === "warn" ? (
                  <p className="mt-2 text-sm font-medium text-warn">{display.flag.text}</p>
                ) : null}
                <p className="mt-3 text-[13px] leading-relaxed text-fg-faint">
                  {copy.details.rangeNote(formatEur(deal.creditRange[0]), formatEur(deal.creditRange[1]))}
                </p>
              </div>
            )}
          </Section>

          <Section title={total ? copy.costs.title : copy.costs.titleNoSwap} className="order-4">
            <CostBreakdown costs={costs} chargesVat={dealer.chargesVat} total={total} swapLine={swapLine} />
          </Section>

          <Section title={copy.details.dealerTitle} className="order-7">
            <div className="rounded-2xl bg-raised p-4">
              <p className="font-semibold">{dealer.name}</p>
              <p className="text-sm text-fg-muted">
                {dealer.area}, {dealer.city}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-fg-faint">
                {copy.details.dealerTakes(dealer.rules.maxAgeYears, formatKm(dealer.rules.maxKm))}
              </p>
            </div>
          </Section>

          <p className="order-8 mt-6 text-xs text-fg-faint">
            {copy.details.photoBy}:{" "}
            <a
              href={credit.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-fg-muted"
            >
              {credit.author}
            </a>
            , {credit.license}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-none bg-linear-to-t from-surface from-55% to-transparent px-5 pt-10 pb-safe lg:px-7 lg:pb-6">
        <div className="pointer-events-auto flex gap-3 lg:ml-auto lg:max-w-md">{actions}</div>
      </div>
    </>
  );
}

function Section({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={cn("mt-7", className)}>
      <h3 className="mb-2.5 text-xs font-semibold tracking-wider text-fg-faint uppercase">{title}</h3>
      {children}
    </section>
  );
}
