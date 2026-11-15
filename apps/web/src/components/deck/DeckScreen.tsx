"use client";

import { use } from "react";
import { browser } from "react-dom";
import { Wordmark } from "@/components/brand/Wordmark";
import { MyCarSheet } from "@/components/car/MyCarSheet";
import { copy } from "@/lib/copy";
import { useIsDesktop } from "@/lib/media";
import { DeckGallery } from "./DeckGallery";
import { DeckPhone } from "./DeckPhone";
import { MatchMoment } from "./MatchMoment";
import { useDeckSession } from "./useDeckSession";

/**
 * The cars on offer, in the shape that suits the screen: a deck to swipe on a
 * phone, a gallery with a garage beside it on anything wide enough. What the
 * visitor has done lives in one session under both, so the shape can change
 * (a tablet turned on its side, a window dragged wider) without losing it.
 */
export function DeckScreen() {
  // Everything here depends on the car, budget and decisions kept on the
  // device, so there is nothing truthful to render on the server.
  use(browser("The deck is built from state stored in localStorage."));

  const session = useDeckSession();
  const desktop = useIsDesktop();

  return (
    <>
      {desktop ? <DeckGallery session={session} /> : <DeckPhone session={session} />}

      <MyCarSheet open={session.carSheetOpen} onOpenChange={session.setCarSheetOpen} />

      <MatchMoment
        card={session.match}
        car={session.car}
        onContinue={session.closeMatch}
        onOpenGarage={session.openGarage}
      />
    </>
  );
}

/** Shown while the browser-only deck is loading. Mirrors its layout on a phone; on a big screen, a quiet line. */
export function DeckSkeleton() {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full max-w-[30rem] flex-1 flex-col lg:max-w-none">
        <div className="box-content flex h-14 shrink-0 items-center px-5 pt-safe lg:h-[4.75rem] lg:px-6 xl:px-10">
          <Wordmark />
        </div>
        <div className="h-12 shrink-0 lg:hidden" />
        <div className="min-h-0 flex-1 px-4 pb-8 lg:px-6 lg:pt-7 xl:px-10 short:pb-7">
          <div className="mx-auto flex h-full max-h-[42rem] w-full max-w-[26rem] animate-pulse items-center justify-center rounded-card bg-surface text-sm text-fg-faint lg:max-h-none lg:max-w-none">
            <span className="lg:hidden">{copy.deck.loading}</span>
            <span className="max-lg:hidden">{copy.gallery.loading}</span>
          </div>
        </div>
        <div className="h-28 shrink-0 lg:h-10" />
      </div>
    </div>
  );
}
