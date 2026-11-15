"use client";

import { ArrowRight, Check, X } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { buttonClass } from "@/components/ui/Button";
import { ByScreen } from "@/components/ui/ByScreen";
import { copy } from "@/lib/copy";
import { allIn } from "@/lib/cost-display";
import { dealLine, describeDeal } from "@/lib/deal-display";
import { formatEur } from "@/lib/format";
import { EXAMPLE_CAR } from "@/lib/reference";
import { pop, rise, stage, useEntrance } from "./entrance";
import { examples } from "./how-examples";
import { SectionHeading } from "./SectionHeading";

const rows = copy.landing.versus;
/** Rows of the board on a big screen: its heading, one per line, and its foot. */
const BOARD_ROWS = rows.length + 2;

/** When line `index` arrives, in seconds: one after another, top to bottom. */
const arrives = (index: number) => 0.1 + index * 0.16;

/**
 * "Zašto ne oglas?": a classified ad and this app, line for line.
 *
 * It is built to be taken in at a glance. Each line leads with what you get
 * here, in the largest type on the board, ticked in red, with a figure beside
 * it that proves it. Two of those figures are worked out from the page's
 * example car, so they are real ones. What the same thing is like through an
 * ad is the small grey print next to it.
 *
 * On a big screen that is two panels side by side, the ad's flat and grey,
 * ours white and raised, with each line of one facing its line in the other.
 * On a phone each line is a card: ours on top, the ad's way as a footnote.
 */
export function WhyNotAnAd() {
  const board = useRef<HTMLUListElement>(null);
  const phase = useEntrance(board, 0.25);

  // The car the walkthrough above deals first, so the figures here match what was just seen.
  const card = examples.deck[0];
  const total = allIn(card.deal, card.costs);
  const worked: Record<string, string> = {
    price: dealLine(describeDeal(card.deal, card.listing), EXAMPLE_CAR.model),
    costs: total ? copy.costs.about(formatEur(total.amount)) : "",
  };

  return (
    <section id="zasto" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-16 lg:px-8 lg:py-24">
      <SectionHeading>{copy.landing.versusTitle}</SectionHeading>
      <p className="mt-3 text-lg text-pretty text-fg-muted">{copy.landing.versusLead}</p>

      <motion.ul
        ref={board}
        className="mt-10 grid grid-cols-1 gap-3 lg:mt-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-5 lg:gap-y-0"
        {...stage(phase)}
      >
        {/* The two panels the lines sit on, on a big screen: theirs flat, ours raised. */}
        <li
          aria-hidden
          style={{ gridRowEnd: `span ${BOARD_ROWS}` }}
          className="hidden rounded-card bg-raised/80 ring-1 ring-line ring-inset lg:col-start-1 lg:row-start-1 lg:block"
        />
        <li
          aria-hidden
          style={{ gridRowEnd: `span ${BOARD_ROWS}` }}
          className="hidden rounded-card bg-surface shadow-card ring-1 ring-line lg:col-start-2 lg:row-start-1 lg:block"
        />

        <li
          aria-hidden
          className="relative hidden items-center px-8 pt-7 pb-4 text-sm font-semibold tracking-wider text-fg-faint uppercase lg:col-start-1 lg:row-start-1 lg:flex"
        >
          {copy.landing.versusAd}
        </li>
        <li
          aria-hidden
          className="relative hidden items-center justify-between px-8 pt-6 pb-4 lg:col-start-2 lg:row-start-1 lg:flex"
        >
          <Wordmark />
          <span className="flex items-center gap-1.5 rounded-full bg-raised px-3 py-1.5 text-xs font-semibold ring-1 ring-line ring-inset">
            <span className="size-1.5 rounded-full bg-accent" />
            {copy.deal.canSwap}
          </span>
        </li>

        {rows.map((row, index) => {
          const at = arrives(index);
          // On a big screen the two halves of a line leave their card and take their places on the board.
          const onBoard = { gridRowStart: index + 2 };
          return (
            <li
              key={row.key}
              data-line={row.key}
              className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line ring-inset lg:contents"
            >
              {/* Ours comes first in the page: on a phone it is the top of the card, and it is the point. */}
              <motion.div
                data-side="ours"
                variants={rise(at, 10)}
                style={onBoard}
                className="relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3.5 px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] lg:col-start-2 lg:gap-x-5 lg:border-t lg:border-line lg:px-8 lg:py-5"
              >
                <motion.span
                  variants={pop(at + 0.15)}
                  aria-hidden
                  className="flex size-7 items-center justify-center rounded-full bg-accent text-on-accent lg:size-8"
                >
                  <Check className="size-4" strokeWidth={3.5} />
                </motion.span>
                <div className="min-w-0">
                  <h3 className="font-display text-xl leading-tight font-bold tracking-tight lg:text-2xl">{row.us}</h3>
                  <p className="mt-1 text-[15px] leading-snug text-pretty text-fg-muted">{row.note}</p>
                </div>
                {/* Beside the line where there is room; under it on a narrow phone. */}
                <motion.p
                  variants={pop(at + 0.28)}
                  className="col-start-2 mt-2 font-display text-xl leading-none font-extrabold tracking-tight whitespace-nowrap text-accent-strong tabular-nums sm:col-start-3 sm:mt-0 sm:text-2xl lg:text-[1.75rem]"
                >
                  {row.proof ?? worked[row.key]}
                </motion.p>
              </motion.div>

              <motion.div
                data-side="theirs"
                variants={rise(at, 10)}
                style={onBoard}
                className="relative flex items-center gap-3 bg-raised/70 px-4 py-3 text-[15px] leading-snug text-fg-muted lg:col-start-1 lg:border-t lg:border-line lg:bg-transparent lg:px-8 lg:py-5 lg:text-base"
              >
                <span
                  aria-hidden
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-hover text-fg-faint"
                >
                  <X className="size-3.5" strokeWidth={3} />
                </span>
                <p>
                  <span className="mb-0.5 block text-[11px] font-semibold tracking-wider text-fg-faint uppercase lg:sr-only">
                    {copy.landing.versusAd}
                    <span className="sr-only">: </span>
                  </span>
                  {row.ad}
                </p>
              </motion.div>
            </li>
          );
        })}

        <li
          aria-hidden
          style={{ gridRowStart: BOARD_ROWS }}
          className="relative hidden items-center border-t border-line px-8 pt-5 pb-7 font-display text-lg font-bold text-fg-muted lg:col-start-1 lg:flex"
        >
          {copy.landing.versusAdEnd}
        </li>
        <li
          style={{ gridRowStart: BOARD_ROWS }}
          className="relative mt-2 lg:col-start-2 lg:mt-0 lg:border-t lg:border-line lg:px-8 lg:pt-5 lg:pb-7"
        >
          <Link
            href="/swipe"
            transitionTypes={["nav-forward"]}
            className={buttonClass({ size: "lg", className: "w-full lg:w-auto" })}
          >
            <ByScreen phone={copy.landing.cta} desktop={copy.landing.ctaDesktop} />
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        </li>
      </motion.ul>
    </section>
  );
}
