import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";
import { OG_FONT, OG_SIZE, ogColors, ogFonts } from "@/lib/og/fonts";

export const alt = "Tvoj auto + doplata = ?";
export const size = OG_SIZE;
export const contentType = "image/png";

const RED = ogColors.redStrong;
const PAPER = ogColors.paper;
const INK = ogColors.ink;

/** Social preview for the site itself: the equation on solid red, in the display face. */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        color: "#ffffff",
        background: RED,
        fontFamily: OG_FONT,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 44, fontWeight: 800 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="44" height="44" viewBox="0 0 32 32">
            <g fill="none" stroke={RED} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 12.5h14.5M19 8.5l4 4-4 4" />
              <path d="M23.5 19.5H9M13 15.5l-4 4 4 4" />
            </g>
          </svg>
        </div>
        {brand.name}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 104, fontWeight: 800, letterSpacing: -3 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 44px",
              borderRadius: 999,
              background: PAPER,
              color: INK,
            }}
          >
            tvoj auto
          </div>
          <span>+</span>
        </div>
        <div
          style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 104, fontWeight: 800, letterSpacing: -3 }}
        >
          <span>doplata</span>
          <span>=</span>
          <span>?</span>
        </div>
      </div>

      <div style={{ display: "flex", fontSize: 34, fontWeight: 500, opacity: 0.9 }}>
        Zamena automobila · {brand.city}
      </div>
    </div>,
    { ...size, fonts: ogFonts },
  );
}
