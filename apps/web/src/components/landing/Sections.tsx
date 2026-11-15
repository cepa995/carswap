import { ArrowRight, Check, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { buttonClass } from "@/components/ui/Button";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { examples } from "./how-examples";

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

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="font-display text-4xl leading-none font-extrabold tracking-tight text-balance sm:text-5xl">
      {children}
    </h2>
  );
}

// ── Side by side with a classified ad ────────────────────────────────────

function Mark({ ours }: { ours: boolean }) {
  const Icon = ours ? Check : X;
  return (
    <span
      aria-hidden
      className={cn(
        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
        ours ? "bg-accent text-on-accent" : "bg-hover text-fg-faint",
      )}
    >
      <Icon className="size-3.5" strokeWidth={3} />
    </span>
  );
}

/**
 * The same five moments of changing a car, done through an ad and done here.
 * Two columns where there is room; on a phone each pair is one card, the ad's
 * way on top and ours under it, each with its own label.
 */
export function WhyNotAnAd() {
  const label = "mb-0.5 block text-[11px] font-semibold tracking-wider uppercase sm:sr-only";

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
      <SectionHeading>{copy.landing.versusTitle}</SectionHeading>

      <div className="mt-10 sm:overflow-hidden sm:rounded-card sm:bg-surface sm:shadow-card sm:ring-1 sm:ring-line">
        <div aria-hidden className="hidden grid-cols-2 sm:grid">
          <p className="bg-raised/70 px-7 pt-6 pb-4 text-sm font-semibold tracking-wider text-fg-faint uppercase">
            {copy.landing.versusAd}
          </p>
          <p className="px-7 pt-5 pb-4">
            <Wordmark />
          </p>
        </div>

        <ul className="flex flex-col gap-3 sm:gap-0">
          {copy.landing.versus.map((row) => (
            <li
              key={row.us}
              className="reveal overflow-hidden rounded-3xl bg-surface ring-1 ring-line ring-inset sm:grid sm:grid-cols-2 sm:rounded-none sm:border-t sm:border-line sm:ring-0"
            >
              <p className="flex gap-3 bg-raised/70 px-5 py-3.5 text-[15px] leading-snug text-fg-muted sm:px-7 sm:py-5 sm:leading-normal">
                <Mark ours={false} />
                <span>
                  <span className={cn(label, "text-fg-faint")}>{copy.landing.versusAd}</span>
                  {row.ad}
                </span>
              </p>
              <p className="flex gap-3 px-5 py-4 leading-snug font-semibold sm:px-7 sm:py-5 sm:text-lg sm:leading-snug">
                <Mark ours />
                <span>
                  <span className={cn(label, "text-accent-strong")}>{brand.name}</span>
                  {row.us}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Questions ────────────────────────────────────────────────────────────

export function Faq() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-24">
      <SectionHeading>{copy.landing.faqTitle}</SectionHeading>
      <div className="mt-8 divide-y divide-line border-y border-line">
        {copy.landing.faq.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-semibold [&::-webkit-details-marker]:hidden">
              {item.q}
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-raised text-fg-muted transition duration-300 ease-out-expo group-open:rotate-45 group-open:bg-accent group-open:text-on-accent">
                <Plus className="size-4" strokeWidth={2.6} aria-hidden />
              </span>
            </summary>
            <p className="max-w-2xl pb-6 text-[15px] leading-relaxed text-pretty text-fg-muted">{item.a}</p>
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
