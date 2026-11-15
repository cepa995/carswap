import { notFound } from "next/navigation";
import { copy } from "@/lib/copy";
import { OG_SIZE } from "@/lib/og/fonts";
import { SHARE_IMAGE_TYPE, shareImage } from "@/lib/og/share-image";
import { findListing } from "@/lib/seed";
import { parseSwap } from "@/lib/share";

export const alt = copy.listing.imageAlt;
export const size = OG_SIZE;
export const contentType = SHARE_IMAGE_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string; car: string; deal: string }> }) {
  const { id, car, deal } = await params;
  const found = findListing(id);
  if (!found) notFound();
  // A swap that does not read back cleanly gets the plain picture, never made-up numbers.
  return shareImage(found.listing, parseSwap(car, deal, found.listing));
}
