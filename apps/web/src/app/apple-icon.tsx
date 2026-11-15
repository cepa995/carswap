import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the swap mark on the accent colour, full bleed. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#db2b39",
      }}
    >
      <svg width="124" height="124" viewBox="0 0 32 32">
        <g fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 12.5h14.5M19 8.5l4 4-4 4" />
          <path d="M23.5 19.5H9M13 15.5l-4 4 4 4" />
        </g>
      </svg>
    </div>,
    size,
  );
}
