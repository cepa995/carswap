import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingScreen } from "@/components/listing/ListingScreen";
import { PageTransition } from "@/components/ui/PageTransition";
import { listingMetadata } from "@/lib/listing-metadata";
import { findListing, listings } from "@/lib/seed";

export function generateStaticParams() {
  return listings.map((listing) => ({ id: listing.id }));
}

/**
 * A shared link lives or dies by its preview in a chat, and the app that
 * draws the preview reads the title and image from <head> without running
 * scripts. So the page is always served whole: one that was not built ahead
 * of time is rendered completely before the first byte goes out, then kept.
 *
 * Left to its default, Next.js would send a shell first and stream the title
 * in afterwards, except to the crawlers on its own list. Viber is not on it.
 */
export const ensureStatic = "navigation";

/** People arrive from a chat, as a full page load; nothing in the app navigates here. */
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/auto/[id]">): Promise<Metadata> {
  const { id } = await params;
  const found = findListing(id);
  return found ? listingMetadata(found.listing, found.dealer, null) : {};
}

/** One car, at an address worth sending to someone. */
export default async function ListingPage({ params }: PageProps<"/auto/[id]">) {
  const { id } = await params;
  const found = findListing(id);
  if (!found) notFound();

  return (
    <PageTransition>
      <ListingScreen listing={found.listing} dealer={found.dealer} swap={null} />
    </PageTransition>
  );
}
