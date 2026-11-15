"use client";

import { ArrowLeftRight, Check, ChevronRight, X } from "lucide-react";
import { motion, type Variants } from "motion/react";
import Image from "next/image";
import { useRef, type ReactNode } from "react";
import { CostBreakdown } from "@/components/car/CostBreakdown";
import { DealSummary } from "@/components/deck/CarCard";
import { CarChip } from "@/components/ui/CarChip";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { allIn } from "@/lib/cost-display";
import { describeDeal } from "@/lib/deal-display";
import type { DeckCard } from "@/lib/domain/deck";
import { springs } from "@/lib/motion";
import { EXAMPLE_CAR } from "@/lib/reference";
import { listingName } from "@/lib/share";
import { pop, rise, stage, useEntrance } from "./entrance";
import { examples } from "./how-examples";
import { SectionHeading } from "./SectionHeading";

/**
 * "Zašto ne oglas?": four things that are tiresome about changing a car
 * through a classified ad, each next to what replaces it here.
 *
 * Each pair is two cards, one on the other, in the deck's own language. The
 * ad's way is the grey one underneath, drawn the way people know it (the
 * messages, the question marks at the counter) and stamped DALJE. Ours lies
 * on top of it, and where the app already has the thing, it is the thing
 * itself: the deal as a card shows it, the costs as the details sheet lists
 * them, with the numbers of a real example.
 *
 * Laid out for a phone: one pair under another, as wide as the screen. With
 * room, they sit two abreast. Each plays once as it scrolls into view.
 */
export function WhyNotAnAd() {
  // The car the walkthrough above deals first, so the two sections tell one story.
  const card = examples.deck[0];
  const display = describeDeal(card.deal, card.listing);
  const { price, costs, time, trust } = copy.landing.versus;

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
      <SectionHeading>{copy.landing.versusTitle}</SectionHeading>
      <p className="mt-3 text-lg text-pretty text-fg-muted">{copy.landing.versusLead}</p>

      {/* One column that cannot grow past the screen, whatever is inside it. */}
      <ul className="mt-10 grid grid-cols-1 gap-y-14 md:grid-cols-2 md:gap-x-12 lg:gap-x-24 lg:gap-y-20">
        <Contrast item={price} theirs={<Haggling />}>
          <DealSummary card={card} car={EXAMPLE_CAR} />
        </Contrast>

        <Contrast item={costs} theirs={<AtTheCounter />}>
          <CostBreakdown
            compact
            costs={card.costs}
            chargesVat={card.dealer.chargesVat}
            total={allIn(card.deal, card.costs)}
            swapLine={
              display.kind === "top-up" || display.kind === "cash-back"
                ? {
                    label: display.kind === "cash-back" ? copy.details.cashBack : copy.details.topUp,
                    value: display.value,
                  }
                : null
            }
          />
        </Contrast>

        <Contrast item={time} theirs={<TheLongWay />}>
          <OneVisit card={card} />
        </Contrast>

        <Contrast item={trust} theirs={<OnTheirWord />}>
          <Checked />
        </Contrast>
      </ul>
    </section>
  );
}

// ── one pair ─────────────────────────────────────────────────────────────

/** When the ad's card is stamped and set aside, in seconds. Long enough to have read it. */
const SET_ASIDE_AT = 1.5;

const theirCard: Variants = {
  hidden: { opacity: 0, y: 16, rotate: 0 },
  shown: {
    opacity: 1,
    y: 0,
    rotate: -2,
    transition: { ...springs.settle, rotate: { ...springs.settle, delay: SET_ASIDE_AT } },
  },
};

const stamp: Variants = {
  hidden: { opacity: 0, scale: 1.9, rotate: 16 },
  shown: { opacity: 1, scale: 1, rotate: 8, transition: { ...springs.bouncy, delay: SET_ASIDE_AT } },
};

const ourCard: Variants = {
  hidden: { opacity: 0, y: 44, scale: 0.96 },
  shown: { opacity: 1, y: 0, scale: 1, transition: { ...springs.settle, delay: SET_ASIDE_AT + 0.25 } },
};

const label = "flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase";

function Mark({ ours, className }: { ours: boolean; className?: string }) {
  const Icon = ours ? Check : X;
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full",
        ours ? "bg-accent text-on-accent" : "bg-hover text-fg-faint",
        className,
      )}
    >
      <Icon className="size-3" strokeWidth={3.5} />
    </span>
  );
}

interface ContrastProps {
  item: { instead: string; title: string; body: string };
  /** The ad's way, drawn. */
  theirs: ReactNode;
  /** Ours: the real thing where there is one. */
  children: ReactNode;
}

function Contrast({ item, theirs, children }: ContrastProps) {
  const pair = useRef<HTMLDivElement>(null);
  const phase = useEntrance(pair);

  return (
    <li className="mx-auto w-full max-w-[26rem] min-w-0 md:mx-0">
      <p className="flex items-center gap-2 text-[15px] text-fg-muted">
        <Mark ours={false} />
        <span className="sr-only">{copy.landing.versusAd}: </span>
        <s className="decoration-fg-faint/70">{item.instead}</s>
      </p>
      <h3 className="mt-2.5 font-display text-[1.75rem] leading-none font-bold tracking-tight">{item.title}</h3>
      <p className="mt-3 leading-relaxed text-pretty text-fg-muted">{item.body}</p>

      {/* A picture of what the lines above say, so it is not read out a second time. */}
      <motion.div ref={pair} aria-hidden className="mt-6" {...stage(phase)}>
        <motion.div
          data-side="theirs"
          variants={theirCard}
          // The room at the bottom is what our card covers, so nothing written is hidden under it.
          className="relative mr-7 rounded-[1.75rem] bg-raised p-4 pb-14 ring-1 ring-line"
        >
          <p className={cn(label, "text-fg-faint")}>{copy.landing.versusAd}</p>
          <div className="mt-3.5">{theirs}</div>
          <motion.span
            variants={stamp}
            className="absolute top-3 right-3 rounded-lg border-[3px] border-fg bg-chip px-2 py-0.5 font-display text-lg leading-none font-extrabold text-fg shadow-float"
          >
            {copy.deck.stampPass}
          </motion.span>
        </motion.div>

        <motion.div
          data-side="ours"
          variants={ourCard}
          className="relative -mt-10 ml-7 rounded-[1.75rem] bg-surface p-4 shadow-card ring-1 ring-line"
        >
          <p className={cn(label, "text-accent-strong")}>
            <Mark ours />
            {brand.name}
          </p>
          <div className="mt-3.5">{children}</div>
        </motion.div>
      </motion.div>
    </li>
  );
}

// ── the ad's way ─────────────────────────────────────────────────────────

const bubble = "rounded-2xl bg-surface px-3.5 py-2 text-[15px] leading-snug text-fg-muted shadow-chip ring-1 ring-line";

/** The messages. They arrive one after another, and one more is being typed. */
function Haggling() {
  const lines = copy.landing.versusChat;
  return (
    <ul className="flex flex-col items-start gap-2">
      {lines.map((line, index) => (
        <motion.li
          key={line}
          variants={pop(0.2 + index * 0.3)}
          className={cn(bubble, "rounded-bl-md", index === 1 && "ml-7", index === 2 && "ml-2")}
        >
          {line}
        </motion.li>
      ))}
      <motion.li variants={pop(0.2 + lines.length * 0.3)} className={cn(bubble, "ml-5 rounded-bl-md py-2.5")}>
        <span className="flex gap-1">
          <span className="size-1.5 rounded-full bg-fg-faint" />
          <span className="size-1.5 rounded-full bg-fg-faint/70" />
          <span className="size-1.5 rounded-full bg-fg-faint/40" />
        </span>
      </motion.li>
    </ul>
  );
}

/** The same three lines our breakdown answers, with nothing in them yet. */
function AtTheCounter() {
  const lines = [copy.costs.transferTax, copy.costs.paperwork, copy.costs.registration];
  return (
    <ul className="flex flex-col gap-2.5">
      {lines.map((line, index) => (
        <li key={line} className="flex items-baseline gap-2 text-[15px] text-fg-muted">
          {line}
          <span className="min-w-4 flex-1 border-b-2 border-dotted border-line-strong" />
          <motion.span
            variants={pop(0.25 + index * 0.28)}
            className="font-display text-xl leading-none font-bold text-fg-faint"
          >
            ?
          </motion.span>
        </li>
      ))}
    </ul>
  );
}

const stepChip = "flex items-center gap-1.5 rounded-full py-1 text-sm";

/** Seven things, one after another, before the second car is yours. */
function TheLongWay() {
  const steps = copy.landing.versusAdSteps;
  return (
    <>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
        {steps.map((step, index) => (
          <motion.li key={step} variants={pop(0.2 + index * 0.15)} className="flex items-center gap-1">
            <span className={cn(stepChip, "bg-surface px-2.5 font-medium text-fg-muted shadow-chip ring-1 ring-line")}>
              {step}
            </span>
            {index < steps.length - 1 ? <ChevronRight className="size-3.5 text-fg-faint" /> : null}
          </motion.li>
        ))}
      </ol>
      <motion.p variants={rise(0.2 + steps.length * 0.15, 6)} className="mt-3 text-sm font-semibold text-fg-muted">
        {copy.landing.versusAdTime}
      </motion.p>
    </>
  );
}

/** What every ad says about its car, stuck on like stickers. */
function OnTheirWord() {
  const tilt = [-3, 2, -1.5, 3];
  return (
    <ul className="flex flex-wrap gap-x-2 gap-y-2.5">
      {copy.landing.versusClaims.map((claim, index) => (
        <motion.li
          key={claim}
          variants={pop(0.2 + index * 0.24)}
          style={{ rotate: tilt[index % tilt.length] }}
          className="rounded-xl bg-surface px-3 py-1.5 text-[15px] font-medium text-fg-muted shadow-chip ring-1 ring-line"
        >
          {claim}
        </motion.li>
      ))}
    </ul>
  );
}

// ── ours, where the app does not have the thing yet ──────────────────────

function Tick() {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
      <Check className="size-3" strokeWidth={3.5} />
    </span>
  );
}

/** Three steps instead of seven, and the two cars changing places. */
function OneVisit({ card }: { card: DeckCard }) {
  const steps = copy.landing.versusOurSteps;
  return (
    <>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-1">
            <span className={cn(stepChip, "bg-raised pr-2.5 pl-1 font-semibold ring-1 ring-line ring-inset")}>
              <Tick />
              {step}
            </span>
            {index < steps.length - 1 ? <ChevronRight className="size-3.5 text-fg-faint" /> : null}
          </li>
        ))}
      </ol>
      {/* Wraps on the narrowest phones, where the name takes a line of its own. */}
      <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <CarChip className="text-[0.95rem]">{EXAMPLE_CAR.model}</CarChip>
        <ArrowLeftRight className="size-5 shrink-0 text-accent-strong" strokeWidth={2.6} />
        <span className="relative aspect-[3/2] w-14 shrink-0 overflow-hidden rounded-xl bg-raised ring-1 ring-line">
          <Image src={card.listing.photo.src} alt="" fill sizes="4rem" className="object-cover" />
        </span>
        <span className="font-display text-[15px] font-bold tracking-tight">{listingName(card.listing)}</span>
      </div>
    </>
  );
}

function Checked() {
  return (
    <ul className="flex flex-col gap-2.5">
      {copy.landing.versusChecks.map((check) => (
        <li key={check} className="flex items-center gap-2.5 text-[15px] font-semibold">
          <Tick />
          {check}
        </li>
      ))}
    </ul>
  );
}
