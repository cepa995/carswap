import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
import { copy } from "@/lib/copy";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.name,
    description: copy.meta.description,
    lang: "sr-Latn",
    start_url: "/swipe",
    display: "standalone",
    orientation: "portrait",
    background_color: "#090e20",
    theme_color: "#090e20",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
