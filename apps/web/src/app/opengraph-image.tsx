import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

export const alt = "Tvoj auto + doplata = ?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social preview. Kept to characters the built-in font is sure to have, so no
 * font has to be fetched while the image is rendered.
 */
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
        color: "#f6f7fb",
        background: "radial-gradient(900px 520px at 85% 0%, rgba(43,75,168,0.75), transparent 70%), #090e20",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 44, fontWeight: 700 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: "#db2b39",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="44" height="44" viewBox="0 0 32 32">
            <g fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 12.5h14.5M19 8.5l4 4-4 4" />
              <path d="M23.5 19.5H9M13 15.5l-4 4 4 4" />
            </g>
          </svg>
        </div>
        {brand.name}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 104, fontWeight: 800, letterSpacing: -3 }}
        >
          <div
            style={{ display: "flex", borderRadius: 22, overflow: "hidden", background: "#f6f7fb", color: "#0b1226" }}
          >
            <div style={{ width: 34, background: "#1f4fd8" }} />
            <div style={{ display: "flex", padding: "10px 34px" }}>TVOJ AUTO</div>
          </div>
          <span style={{ color: "#a9b4d0" }}>+</span>
        </div>
        <div
          style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 104, fontWeight: 800, letterSpacing: -3 }}
        >
          <span>doplata</span>
          <span style={{ color: "#a9b4d0" }}>=</span>
          <span style={{ color: "#ff6b70" }}>?</span>
        </div>
      </div>

      <div style={{ display: "flex", fontSize: 34, color: "#a9b4d0" }}>Zamena automobila · {brand.city}</div>
    </div>,
    size,
  );
}
