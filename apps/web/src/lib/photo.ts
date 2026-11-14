import type { Photo } from "@/lib/domain/types";

const NARROWEST = 1.4;
const WIDEST = 1.85;

/**
 * The aspect ratio to show a listing photo at: its own, within limits.
 *
 * Car photos arrive anywhere from 4:3 to 16:9, and the car usually fills the
 * width, so forcing them all into one box would crop bumpers. Following the
 * photo keeps the whole car in view; the limits stop an odd upload from
 * producing a sliver or a tower.
 */
export function displayAspect(photo: Photo): number {
  return Math.min(WIDEST, Math.max(NARROWEST, photo.width / photo.height));
}
