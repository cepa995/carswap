import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { brand } from "@/lib/brand";
import { copy, fuelLabel } from "@/lib/copy";
import { dealShape } from "@/lib/domain/deal";
import type { Dealer, Listing } from "@/lib/domain/types";
import { formatEur, formatKm } from "@/lib/format";
import { findListing } from "@/lib/seed";
import { listingName, type SharedSwap } from "@/lib/share";
import { OG_FONT, OG_SIZE, ogColors, ogFonts } from "./fonts";

/** What the image routes declare as their type. */
export const SHARE_IMAGE_TYPE = "image/jpeg";

const PADDING = 56;
const PHOTO = { width: 510, height: 340 };
const COLUMN = OG_SIZE.width - PADDING * 2 - PHOTO.width - 56;

/** Average glyph width of the display face, in em. Good enough to keep a line inside its column. */
const EM_PER_CHAR = 0.56;

/** The largest size, up to `max`, at which the text still fits on one line of the column. */
function fit(text: string, max: number, min = 44): number {
  return Math.max(min, Math.min(max, Math.floor(COLUMN / (text.length * EM_PER_CHAR))));
}

/** The renderer draws a non-breaking space as a gap of its own width; a plain one sets better. */
const plain = (text: string) => text.replace(/ /g, " ");

interface Line {
  text: string;
  tone: "ink" | "red";
  /** Largest font size worth using for this line. */
  max: number;
}

/** The two lines under the sender's car: which is the headline depends on which way the money goes. */
function lines(listing: Listing, swap: SharedSwap | null): Line[] {
  const name = listingName(listing);
  if (!swap) {
    return [
      { text: name, tone: "ink", max: 84 },
      { text: plain(formatEur(listing.priceEur)), tone: "red", max: 128 },
    ];
  }
  const shape = dealShape(swap.topUp);
  if (shape === "top-up") {
    return [
      { text: plain(formatEur(swap.topUp)), tone: "red", max: 136 },
      { text: `= ${name}`, tone: "ink", max: 68 },
    ];
  }
  if (shape === "cash-back") {
    return [
      { text: name, tone: "ink", max: 76 },
      { text: `+ ${plain(formatEur(-swap.topUp))} ${copy.share.cash}`, tone: "red", max: 104 },
    ];
  }
  return [
    { text: name, tone: "ink", max: 76 },
    { text: copy.share.even, tone: "red", max: 104 },
  ];
}

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx="10" fill={ogColors.red} />
      <g fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 12.5h14.5M19 8.5l4 4-4 4" />
        <path d="M23.5 19.5H9M13 15.5l-4 4 4 4" />
      </g>
    </svg>
  );
}

/** The visitor's car, drawn the way the app draws it everywhere: a white chip with a red badge. */
function CarChip({ model }: { model: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "8px 30px 8px 8px",
        borderRadius: 999,
        background: ogColors.surface,
        border: `2px solid ${ogColors.line}`,
        fontSize: 46,
        fontWeight: 800,
        letterSpacing: -1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 60,
          height: 60,
          borderRadius: 999,
          background: ogColors.red,
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24">
          <g fill="none" stroke="#ffffff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8" />
            <path d="M7 14h.01" />
            <path d="M17 14h.01" />
            <rect width="18" height="8" x="3" y="10" rx="2" />
            <path d="M5 18v2" />
            <path d="M19 18v2" />
          </g>
        </svg>
      </div>
      {model}
    </div>
  );
}

/**
 * The picture a chat app shows for a shared link: the sender's equation next
 * to the car. Messengers show it small, so it carries one idea in big type
 * and repeats nothing the link's title already says in full.
 *
 * The photo is somebody's work under a Creative Commons licence, and this
 * image travels without the page around it, so the credit is printed on it.
 */
export async function shareImage(listing: Listing, swap: SharedSwap | null): Promise<Response> {
  const jpeg = await shareImageJpeg(listing.id, swap?.model ?? null, swap?.topUp ?? null);
  if (!jpeg) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": SHARE_IMAGE_TYPE,
      // Listings change, and the address of this image does not change with them.
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

/**
 * The finished image for one link, as JPEG bytes.
 *
 * Kept after the first request: drawing takes a few hundred milliseconds and
 * gives the same bytes every time, and one link is fetched by the sender's
 * app, the recipient's, and whoever it is forwarded to. The arguments are the
 * whole cache key, which is why they are an id and two plain values.
 *
 * The renderer only writes PNG, which for a picture with a photo in it comes
 * to about half a megabyte: more than some messengers will fetch. Re-encoded
 * as JPEG it is about a fifth of that, with nothing lost that a chat shows.
 */
async function shareImageJpeg(listingId: string, model: string | null, topUp: number | null) {
  "use cache";
  cacheLife("days");

  const found = findListing(listingId);
  if (!found) return null;
  const swap = model !== null && topUp !== null ? { model, topUp } : null;

  const png = await drawShareImage(found.listing, found.dealer, swap).arrayBuffer();
  // Full chroma resolution keeps the red type crisp against the paper.
  const jpeg = await sharp(png).jpeg({ quality: 86, chromaSubsampling: "4:4:4", mozjpeg: true }).toBuffer();
  return new Uint8Array(jpeg);
}

function drawShareImage(listing: Listing, dealer: Dealer, swap: SharedSwap | null): ImageResponse {
  // `listing.id` comes from our own data, never from the URL as typed.
  const photo = readFileSync(join(process.cwd(), "assets/share-photos", `${listing.id}.jpg`)).toString("base64");
  const { credit } = listing.photo;
  const facts = [String(listing.year), plain(formatKm(listing.km)), fuelLabel[listing.fuel]].join(" · ");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: PADDING,
        background: ogColors.paper,
        color: ogColors.ink,
        fontFamily: OG_FONT,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 40, fontWeight: 800, letterSpacing: -1 }}
        >
          <Mark size={56} />
          {brand.name}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 26px",
            borderRadius: 999,
            background: ogColors.surface,
            border: `2px solid ${ogColors.line}`,
            fontSize: 28,
            fontWeight: 800,
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: 999, background: ogColors.red }} />
          {copy.deal.canSwap}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: COLUMN }}>
          {swap ? (
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 18 }}>
              <CarChip model={swap.model} />
              <div style={{ display: "flex", fontSize: 64, fontWeight: 800 }}>
                {dealShape(swap.topUp) === "top-up" ? "+" : "="}
              </div>
            </div>
          ) : null}
          {lines(listing, swap).map((line) => (
            <div
              key={line.text}
              style={{
                display: "flex",
                fontSize: fit(line.text, line.max),
                fontWeight: 800,
                letterSpacing: -2,
                lineHeight: 1.08,
                color: line.tone === "red" ? ogColors.redStrong : ogColors.ink,
              }}
            >
              {line.text}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div
            style={{
              display: "flex",
              borderRadius: 44,
              border: `10px solid ${ogColors.surface}`,
              boxShadow: "0 24px 48px rgba(58, 32, 12, 0.22)",
              transform: "rotate(2deg)",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- drawn by the image renderer, not a browser */}
            <img
              src={`data:image/jpeg;base64,${photo}`}
              alt=""
              width={PHOTO.width}
              height={PHOTO.height}
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32 }}>
        <div style={{ display: "flex", fontSize: 28, fontWeight: 500, color: ogColors.muted }}>
          {facts} · {dealer.name}, {dealer.city}
        </div>
        <div style={{ display: "flex", flexShrink: 0, fontSize: 17, fontWeight: 500, color: ogColors.faint }}>
          {copy.details.photoBy}: {credit.author}, {credit.license}
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: ogFonts },
  );
}
