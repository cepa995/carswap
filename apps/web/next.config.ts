import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The deck fills a phone screen edge to edge, so the dev badge always lands
  // on a control whichever corner it sits in. Errors are still shown.
  devIndicators: false,
  // Link-preview images are drawn on the server from files the bundler cannot
  // see being read (the photo's path is built from a listing id), so they are
  // named here to make sure a deployment ships them.
  outputFileTracingIncludes: {
    "/auto/**": ["./assets/fonts/*", "./assets/share-photos/*"],
    "/opengraph-image": ["./assets/fonts/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
