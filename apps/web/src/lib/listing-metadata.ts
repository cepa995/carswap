import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { copy, fuelLabel, gearboxLabel } from "@/lib/copy";
import type { Dealer, Listing } from "@/lib/domain/types";
import { formatKm } from "@/lib/format";
import { shareHeadline, sharePath, type SharedSwap } from "@/lib/share";

const plain = (text: string) => text.replace(/ /g, " ");

/**
 * What a chat app shows for a link to a car. The title carries the equation,
 * because messengers always show the title and often shrink the picture.
 */
export function listingMetadata(listing: Listing, dealer: Dealer, swap: SharedSwap | null): Metadata {
  const title = plain(shareHeadline(listing, swap));
  const specs = [String(listing.year), formatKm(listing.km), fuelLabel[listing.fuel], gearboxLabel[listing.gearbox]];
  const description = plain(copy.listing.description(specs.join(" · "), `${dealer.name}, ${dealer.city}`));

  return {
    title,
    description,
    // One car, one page for search engines, however many swaps point at it.
    alternates: { canonical: sharePath(listing.id, null) },
    ...(swap ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      locale: "sr_RS",
      siteName: brand.name,
      title,
      description,
      url: sharePath(listing.id, swap),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
