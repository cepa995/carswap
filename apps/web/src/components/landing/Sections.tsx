import { ArrowRight, Calculator, Check, KeyRound, MegaphoneOff, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { buttonClass } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { estimateValue } from "@/lib/domain/valuation";
import { formatEur, formatInt } from "@/lib/format";
import { EXAMPLE_CAR, REFERENCE_YEAR } from "@/lib/reference";

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

// ── How it works ─────────────────────────────────────────────────────────

// Worked out with the same estimate the app uses, so the example cannot drift from the product.
const exampleEstimate = estimateValue(EXAMPLE_CAR, REFERENCE_YEAR);

const stepArt: ReactNode[] = [
  <div key="car" className="flex flex-col items-start gap-3">
    <Plate className="text-lg">
      {EXAMPLE_CAR.model} · {EXAMPLE_CAR.year}
    </Plate>
    <p className="font-display text-[1.7rem] leading-none font-extrabold tracking-tight tabular-nums">
      {formatInt(exampleEstimate.low)} – {formatEur(exampleEstimate.high)}
    </p>
  </div>,

  <div key="swipe" className="relative h-28 w-24">
    <div className="absolute inset-x-2 top-0 bottom-1 -rotate-[10deg] rounded-2xl bg-hover ring-1 ring-line-strong" />
    <div className="absolute inset-x-2 top-0 bottom-1 rotate-[8deg] rounded-2xl bg-linear-to-b from-[#56668c] to-[#1b1f2e] ring-1 ring-white/20">
      <span className="absolute top-3 -left-6 -rotate-12 rounded-lg border-[3px] border-accent bg-plate px-1.5 py-0.5 font-display text-base leading-none font-extrabold text-accent-strong">
        {copy.deck.stampLike}
      </span>
      <span className="absolute inset-x-2.5 bottom-2.5 h-2 rounded-full bg-white/25" />
      <span className="absolute bottom-6 left-2.5 h-2 w-8 rounded-full bg-white/40" />
    </div>
  </div>,

  <div key="match" className="flex flex-col items-start gap-3">
    <span className="-rotate-3 rounded-2xl bg-accent px-3.5 py-2 font-display text-2xl leading-none font-extrabold text-on-accent">
      {copy.match.title}
    </span>
    <ul className="flex flex-wrap gap-1.5 text-xs font-medium text-fg-muted">
      {copy.landing.closingSteps.map((item) => (
        <li key={item} className="flex items-center gap-1 rounded-full bg-hover px-2.5 py-1">
          <Check className="size-3 text-sky" strokeWidth={3} aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  </div>,
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
      <SectionHeading>{copy.landing.howTitle}</SectionHeading>
      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {copy.landing.steps.map((step, index) => (
          <li key={step.title} className="reveal flex flex-col rounded-card bg-surface p-3 ring-1 ring-line ring-inset">
            <div
              aria-hidden
              className="flex h-44 items-center justify-center rounded-[1.4rem] bg-raised/70 px-5 ring-1 ring-line ring-inset"
            >
              {stepArt[index]}
            </div>
            <div className="p-4 pt-5">
              <p className="font-display text-sm font-bold tracking-wider text-sky tabular-nums">0{index + 1}</p>
              <h3 className="mt-1 font-display text-2xl font-bold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-pretty text-fg-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ── Why not a classified ad ──────────────────────────────────────────────

const whyIcons = [MegaphoneOff, Calculator, KeyRound, ShieldCheck];

export function WhyNotAnAd() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
      <SectionHeading>{copy.landing.whyTitle}</SectionHeading>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {copy.landing.why.map((point, index) => {
          const Icon = whyIcons[index];
          return (
            <li
              key={point.title}
              className={cn(
                "reveal flex gap-5 rounded-card p-6 ring-1 ring-inset",
                index === 1 ? "bg-accent-strong text-on-accent ring-transparent" : "bg-surface ring-line",
              )}
            >
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                  index === 1 ? "bg-on-accent/15" : "bg-raised text-sky ring-1 ring-line-strong ring-inset",
                )}
              >
                <Icon className="size-6" aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-2xl leading-tight font-bold tracking-tight">{point.title}</h3>
                <p
                  className={cn(
                    "mt-1.5 text-[15px] leading-relaxed text-pretty",
                    index === 1 ? "text-on-accent/90" : "text-fg-muted",
                  )}
                >
                  {point.body}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
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

export function Closing() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-8 pb-16 lg:px-8">
      <div className="reveal relative overflow-hidden rounded-[2.5rem] bg-accent-strong px-7 py-14 text-on-accent sm:px-14 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 grain opacity-20 mix-blend-multiply" />
        <h2 className="relative max-w-3xl font-display text-[2.6rem] leading-[0.95] font-extrabold tracking-[-0.03em] text-balance sm:text-6xl">
          {copy.landing.closingTitle}
        </h2>
        <Link
          href="/swipe"
          transitionTypes={["nav-forward"]}
          className="relative mt-9 inline-flex h-14 items-center gap-2 rounded-full bg-fg px-7 text-base font-semibold text-canvas transition duration-200 ease-out-expo hover:bg-sky active:scale-[0.97]"
        >
          {copy.landing.cta}
          <ArrowRight className="size-5" aria-hidden />
        </Link>
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
