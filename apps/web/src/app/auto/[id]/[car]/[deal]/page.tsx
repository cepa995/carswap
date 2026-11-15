import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ListingScreen } from "@/components/listing/ListingScreen";
import { PageTransition } from "@/components/ui/PageTransition";
import { listingMetadata } from "@/lib/listing-metadata";
import { EXAMPLE_CAR } from "@/lib/reference";
import { findListing, listings } from "@/lib/seed";
import { parseSwap, sharePath, swapSegments } from "@/lib/share";

type Props = PageProps<"/auto/[id]/[car]/[deal]">;

/** As for the car's own page: always served whole, so a chat app finds the title and image in <head>. */
export const ensureStatic = "navigation";
export const instant = false;

/**
 * The swaps people share are endless, so they are rendered the first time
 * someone opens one and kept after that. One real example is built ahead of
 * time, which is what lets the build check the route.
 */
export function generateStaticParams() {
  const listing = listings.find((candidate) => candidate.priceEur >= 8000) ?? listings[0];
  return [{ id: listing.id, ...swapSegments({ model: EXAMPLE_CAR.model, topUp: listing.priceEur - 6000 }) }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, car, deal } = await params;
  const found = findListing(id);
  if (!found) return {};
  return listingMetadata(found.listing, found.dealer, parseSwap(car, deal, found.listing));
}

/** A car together with the swap the sender worked out for their own. */
export default async function SharedSwapPage({ params }: Props) {
  const { id, car, deal } = await params;
  const found = findListing(id);
  if (!found) notFound();

  // A swap that does not read back cleanly is dropped, and the link still opens the car.
  const swap = parseSwap(car, deal, found.listing);
  if (!swap) redirect(sharePath(id, null));

  return (
    <PageTransition>
      <ListingScreen listing={found.listing} dealer={found.dealer} swap={swap} />
    </PageTransition>
  );
}
