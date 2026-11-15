import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import { brand } from "@/lib/brand";
import { copy } from "@/lib/copy";
import "./globals.css";

// Both families ship Latin Extended, which Serbian needs for č, ć, š, ž and đ.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  // Optical sizing: tighter, higher-contrast letterforms at headline sizes.
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${copy.meta.title} · ${brand.name}`,
    template: `%s · ${brand.name}`,
  },
  description: copy.meta.description,
  applicationName: brand.name,
  appleWebApp: { capable: true, title: brand.name, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  // Demo inventory is made up; keep it out of search results until real stock replaces it.
  robots: brand.isDemo ? { index: false, follow: false } : undefined,
  openGraph: {
    type: "website",
    locale: "sr_RS",
    siteName: brand.name,
    title: copy.meta.title,
    description: copy.meta.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f4ee",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sr-Latn" className={`${geist.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
