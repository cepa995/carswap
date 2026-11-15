"use client";

import { useState, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import type { DeckCard } from "@/lib/domain/deck";
import type { UserCar } from "@/lib/domain/types";
import { swapToShare } from "@/lib/share";
import { ShareSheet } from "./ShareSheet";

interface ShareButtonProps {
  card: DeckCard;
  car: UserCar | null;
  /** Where the button sits, for the funnel. */
  source: "details" | "match";
  className?: string;
  children: ReactNode;
}

/**
 * A button that opens the share sheet for one car. The sheet is rendered next
 * to the button, so it nests correctly inside whichever dialog the button is in.
 */
export function ShareButton({ card, car, source, className, children }: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setOpen(true);
          track("share_opened", {
            listingId: card.listing.id,
            source,
            withSwap: swapToShare(card.deal, car?.model ?? null) !== null,
          });
        }}
      >
        {children}
      </button>
      <ShareSheet open={open} onOpenChange={setOpen} card={card} car={car} />
    </>
  );
}
