import type { Metadata } from "next";
import { Suspense } from "react";
import { GarageScreen } from "@/components/garage/GarageScreen";
import { PageTransition } from "@/components/ui/PageTransition";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.nav.garage };

export default function GaragePage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-dvh" />}>
        <GarageScreen />
      </Suspense>
    </PageTransition>
  );
}
