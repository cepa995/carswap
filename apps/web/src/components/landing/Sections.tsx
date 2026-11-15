import { ArrowRight, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { DealSummary } from "@/components/deck/CarCard";
import { buttonClass } from "@/components/ui/Button";
import { CarChip } from "@/components/ui/CarChip";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { formatEur, formatInt } from "@/lib/format";
import { EXAMPLE_CAR } from "@/lib/reference";
import { dealers } from "@/lib/seed";
import { listingName } from "@/lib/share";
import { exampleEstimate, examples } from "./how-examples";
import { SectionHeading } from "./SectionHeading";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto box-content flex h-16 max-w-6xl items-center justify-between px-5 pt-safe lg:px-8">
        <Link href="/" aria-label={brand.name}>
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-1.5">
          <Link
            href="/garage"
            transitionTypes={["nav-forward"]}
            className="hidden h-10 items-center rounded-full px-4 text-sm font-semibold text-fg-muted hover:bg-raised hover:text-fg sm:flex"
          >
            {copy.landing.garage}
          </Link>
          <Link href="/swipe" transitionTypes={["nav-forward"]} className={buttonClass({ size: "sm" })}>
            {copy.nav.start}
          </Link>
        </nav>
      </div>
    </header>
  );
}

// ── Questions ────────────────────────────────────────────────────────────

/**
 * Where an answer is about something the app shows, the answer shows it: the
 * estimate as the range it is, the deal on a cheaper car as a card has it,
 * the dealers by name. Keyed by the `key` of each question in the copy.
 */
const faqPieces: Partial<Record<(typeof copy.landing.faq)[number]["key"], ReactNode>> = {
  estimate: (
    <div className="rounded-3xl bg-raised p-4">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm font-medium text-fg-muted">
        <CarChip className="text-[0.85rem]">
          {EXAMPLE_CAR.model} · {EXAMPLE_CAR.year}
        </CarChip>
        {copy.wizard.resultLead}
      </div>
      <p className="mt-2 font-display text-[2rem] leading-none font-extrabold tracking-tight tabular-nums">
        {formatInt(exampleEstimate.low)}
        <span className="mx-[0.12em] text-fg-faint">–</span>
        {formatEur(exampleEstimate.high)}
      </p>
    </div>
  ),
  cheaper: (
    <div className="rounded-3xl bg-raised p-4">
      <p className="mb-2.5 text-sm font-medium text-fg-muted">{listingName(examples.down.listing)}</p>
      <DealSummary card={examples.down} car={EXAMPLE_CAR} />
    </div>
  ),
  dealers: (
    <ul className="flex flex-wrap gap-2">
      {dealers.map((dealer) => (
        <li key={dealer.id} className="rounded-full bg-raised px-3 py-1.5 text-sm font-medium">
          {dealer.name}
          <span className="text-fg-muted"> · {dealer.area}</span>
        </li>
      ))}
    </ul>
  ),
};

export function Faq() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-24">
      <SectionHeading>{copy.landing.faqTitle}</SectionHeading>
      <div className="mt-8 flex flex-col gap-2.5">
        {copy.landing.faq.map((item, index) => (
          // The first is open, so it is plain at a glance that these open and what is inside.
          <details
            key={item.key}
            open={index === 0}
            className="faq group rounded-3xl bg-surface ring-1 ring-line transition-shadow duration-300 ring-inset open:shadow-float"
          >
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-3xl px-5 py-4 text-[17px] leading-snug font-semibold [&::-webkit-details-marker]:hidden">
              {item.q}
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-raised text-fg-muted transition duration-300 ease-out-expo group-open:rotate-45 group-open:bg-accent group-open:text-on-accent">
                <Plus className="size-4" strokeWidth={2.6} aria-hidden />
              </span>
            </summary>
            <div className="px-5 pb-5">
              <p className="max-w-2xl text-[15px] leading-relaxed text-pretty text-fg-muted">{item.a}</p>
              {faqPieces[item.key] ? <div className="mt-4 max-w-[24rem]">{faqPieces[item.key]}</div> : null}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

// ── Closing call to action and footer ────────────────────────────────────

/** A car caught mid-swipe, liked: the one thing the closing line is about. */
function LikedCard({ src, sizes, className }: { src: string; sizes: string; className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none", className)}>
      <div className="relative aspect-[3/2] overflow-hidden rounded-[1.75rem] shadow-card ring-4 ring-white">
        <Image src={src} alt="" fill sizes={sizes} className="object-cover" />
      </div>
      <span className="absolute -top-3 -left-4 -rotate-12 rounded-xl border-4 border-accent bg-chip px-3 py-1.5 font-display text-2xl leading-none font-extrabold text-accent-strong shadow-float">
        {copy.deck.stampLike}
      </span>
    </div>
  );
}

export function Closing() {
  // The car the walkthrough above starts its deck with.
  const { src } = examples.deck[0].listing.photo;

  return (
    <section className="mx-auto max-w-6xl px-5 pt-8 pb-16 lg:px-8">
      <div className="reveal relative overflow-hidden rounded-[2.5rem] bg-accent-strong px-7 py-14 text-on-accent sm:px-14 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 grain opacity-20 mix-blend-multiply" />
        <h2 className="relative max-w-3xl font-display text-[2.6rem] leading-[0.95] font-extrabold tracking-[-0.03em] text-balance sm:text-6xl lg:max-w-xl">
          {copy.landing.closingTitle}
        </h2>
        <Link
          href="/swipe"
          transitionTypes={["nav-forward"]}
          className="relative mt-9 inline-flex h-14 items-center gap-2 rounded-full bg-surface px-7 text-base font-semibold text-fg shadow-float transition duration-200 ease-out-expo hover:bg-raised active:scale-[0.97]"
        >
          {copy.landing.cta}
          <ArrowRight className="size-5" aria-hidden />
        </Link>

        {/* On a phone the card leans in from the bottom corner, cut off by the block's edge. */}
        <LikedCard
          src={src}
          sizes="16rem"
          className="relative mt-12 -mb-28 ml-auto w-[15.5rem] -rotate-6 sm:-mb-36 lg:hidden"
        />
        {/* With room to the side, it sits there whole. */}
        <LikedCard
          src={src}
          sizes="21rem"
          className="absolute top-1/2 right-12 hidden w-[17rem] -translate-y-1/2 rotate-[8deg] lg:block xl:w-[21rem]"
        />
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-6xl px-5 pb-12 lg:px-8">
      <div className="flex flex-col gap-5 border-t border-line pt-8 text-sm text-fg-faint sm:flex-row sm:items-center sm:justify-between">
        <Wordmark className="text-fg" />
        <div className="flex flex-col gap-1.5 sm:items-end">
          {brand.isDemo ? <p>{copy.common.demoNote}</p> : null}
          <Link href="/credits" className="underline underline-offset-4 hover:text-fg-muted">
            {copy.landing.footerCredits}
          </Link>
        </div>
      </div>
    </footer>
  );
}
