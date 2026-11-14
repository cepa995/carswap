import type { Metadata } from "next";
import { Suspense } from "react";
import { DeckScreen, DeckSkeleton } from "@/components/deck/DeckScreen";
import { PageTransition } from "@/components/ui/PageTransition";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.nav.deck };

export default function SwipePage() {
  return (
    <PageTransition>
      <Suspense fallback={<DeckSkeleton />}>
        <DeckScreen />
      </Suspense>
    </PageTransition>
  );
}
