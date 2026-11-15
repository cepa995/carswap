import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The display face for generated images. The renderer cannot use the variable
 * WOFF2 files browsers get, so static copies live in `assets/fonts`. Read once,
 * when the module loads: they are the same for every image.
 */
const read = (file: string) => readFileSync(join(process.cwd(), "assets/fonts", file));

export const OG_FONT = "Bricolage Grotesque";

export const ogFonts = [
  { name: OG_FONT, data: read("BricolageGrotesque-ExtraBold.ttf"), weight: 800 as const, style: "normal" as const },
  { name: OG_FONT, data: read("BricolageGrotesque-Medium.ttf"), weight: 500 as const, style: "normal" as const },
];

export const OG_SIZE = { width: 1200, height: 630 };

export const ogColors = {
  paper: "#f8f4ee",
  surface: "#ffffff",
  ink: "#1a1512",
  muted: "#5c534a",
  faint: "#6e655b",
  red: "#db2b39",
  redStrong: "#c2202e",
  line: "rgba(34, 24, 14, 0.14)",
} as const;
