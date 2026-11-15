import { notFound } from "next/navigation";
import { copy } from "@/lib/copy";
import { OG_SIZE } from "@/lib/og/fonts";
import { SHARE_IMAGE_TYPE, shareImage } from "@/lib/og/share-image";
import { findListing } from "@/lib/seed";

export const alt = copy.listing.imageAlt;
export const size = OG_SIZE;
export const contentType = SHARE_IMAGE_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = findListing(id);
  if (!found) notFound();
  return shareImage(found.listing, null);
}
