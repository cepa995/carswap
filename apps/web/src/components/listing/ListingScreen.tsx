import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { CostBreakdown } from "@/components/car/CostBreakdown";
import { buttonClass } from "@/components/ui/Button";
import { CarChip } from "@/components/ui/CarChip";
import { brand } from "@/lib/brand";
import { copy, fuelLabel, gearboxLabel } from "@/lib/copy";
import { estimateCosts } from "@/lib/domain/costs";
import { dealShape } from "@/lib/domain/deal";
import type { Dealer, Listing } from "@/lib/domain/types";
import { formatEur, formatKm } from "@/lib/format";
import { displayAspect } from "@/lib/photo";
import { REFERENCE_YEAR } from "@/lib/reference";
import { deckPath, listingName, type SharedSwap } from "@/lib/share";

interface ListingScreenProps {
  listing: Listing;
  dealer: Dealer;
  /** The sender's swap, when the link carries one. */
  swap: SharedSwap | null;
}

/**
 * Where a shared link lands: one car, the sender's equation if they sent one,
 * and a single way forward, which is to see the same car against your own.
 *
 * Rendered ahead of time, so chat apps and people on slow connections get it
 * whole. Nothing here knows who is looking.
 */
export function ListingScreen({ listing, dealer, swap }: ListingScreenProps) {
  const name = listingName(listing);
  // The page is built ahead of time, where there is no clock to read.
  const costs = estimateCosts(listing, dealer, REFERENCE_YEAR);
  const specs = [String(listing.year), formatKm(listing.km), fuelLabel[listing.fuel], gearboxLabel[listing.gearbox]];
  const credit = listing.photo.credit;

  return (
    <div className="relative isolate min-h-dvh">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 ambient" />

      <div className="mx-auto w-full max-w-[30rem] px-5 pb-12">
        <header className="box-content flex h-14 items-center justify-between pt-safe">
          <Link href="/" aria-label={brand.name} className="flex items-center gap-2.5">
            <Wordmark />
            {brand.isDemo ? (
              <span className="rounded-full bg-raised px-2 py-0.5 text-[10px] font-semibold tracking-wider text-fg-faint uppercase ring-1 ring-line ring-inset">
                {copy.common.demoBadge}
              </span>
            ) : null}
          </Link>
        </header>

        <main>
          <div
            className="relative mt-2 overflow-hidden rounded-card bg-raised shadow-card ring-1 ring-line"
            style={{ aspectRatio: displayAspect(listing.photo) }}
          >
            <Image
              src={listing.photo.src}
              alt={`${name}, ${listing.color}`}
              fill
              sizes="(max-width: 30rem) 100vw, 28rem"
              loading="eager"
              fetchPriority="high"
              className="object-cover"
            />
            <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-chip-ink shadow-chip ring-1 ring-black/[0.06]">
              <span aria-hidden className="size-1.5 rounded-full bg-accent" />
              {copy.deal.canSwap}
            </span>
          </div>

          <div className="mt-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-[2rem] leading-none font-bold tracking-tight text-balance">{name}</h1>
              <p className="mt-1.5 text-sm text-fg-muted">{listing.variant}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-medium tracking-wider text-fg-faint uppercase">{copy.deal.price}</p>
              <p className="font-display text-xl font-bold tabular-nums">{formatEur(listing.priceEur)}</p>
            </div>
          </div>

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {specs.map((spec) => (
              <li
                key={spec}
                className="rounded-full bg-surface px-2.5 py-1 text-[13px] font-medium tabular-nums ring-1 ring-line"
              >
                {spec}
              </li>
            ))}
          </ul>

          {swap ? <SentSwap swap={swap} /> : null}

          <Link
            href={deckPath(listing.id)}
            transitionTypes={["nav-forward"]}
            className={buttonClass({ size: "lg", className: "mt-5 w-full" })}
          >
            {copy.listing.cta}
            <ArrowRight className="size-5" aria-hidden />
          </Link>
          {swap ? <p className="mt-2.5 text-center text-sm text-fg-muted">{copy.listing.yours}</p> : null}

          <Section title={copy.costs.titleNoSwap}>
            <CostBreakdown costs={costs} chargesVat={dealer.chargesVat} />
          </Section>

          <Section title={copy.details.highlightsTitle}>
            <ul className="flex flex-wrap gap-2">
              {listing.highlights.map((highlight) => (
                <li key={highlight} className="rounded-full bg-surface px-3.5 py-2 text-sm ring-1 ring-line">
                  {highlight}
                </li>
              ))}
            </ul>
          </Section>

          <Section title={copy.details.dealerTitle}>
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
        </main>

        <footer className="mt-6 text-xs text-fg-faint">
          <p>
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
          {brand.isDemo ? <p className="mt-2">{copy.common.demoNote}</p> : null}
        </footer>
      </div>
    </div>
  );
}

/** The sender's equation, set the way a card in the deck sets the visitor's own. */
function SentSwap({ swap }: { swap: SharedSwap }) {
  const shape = dealShape(swap.topUp);
  const figure = "font-display text-[2.1rem] leading-none font-bold tracking-tight text-accent-strong tabular-nums";

  return (
    <div className="mt-5 rounded-3xl bg-raised p-4">
      <p className="text-sm font-medium text-fg-muted">{copy.listing.sentBy}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <CarChip className="text-base">{swap.model}</CarChip>
        {shape === "top-up" ? (
          <>
            <span className="text-2xl leading-none font-semibold">+</span>
            <span className={figure}>{formatEur(swap.topUp)}</span>
          </>
        ) : shape === "cash-back" ? (
          <>
            <span className="text-sm font-medium text-fg-muted">{copy.listing.senderGets}</span>
            <span className={figure}>{formatEur(-swap.topUp)}</span>
          </>
        ) : (
          <>
            <span className="text-2xl leading-none font-semibold">=</span>
            <span className={figure}>{copy.deal.evenValue}</span>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-2.5 text-xs font-semibold tracking-wider text-fg-faint uppercase">{title}</h2>
      {children}
    </section>
  );
}
