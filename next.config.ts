import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/gifts",
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Image uploads flow through the `uploadAsset` server action; the default
      // 1 MB body cap must cover the largest allowed upload (products = 10 MB).
      bodySizeLimit: "12mb",
    },
  },
  images: {
    // Allowed `quality` values for next/image. Product photos render at 90 so
    // catalog cards look sharp on first paint (default 75 looks soft once the
    // browser has cached the detail page's larger variant). 75 kept for
    // thumbnails and anything that omits an explicit quality.
    qualities: [75, 90],
    // Content images are hosted as Hygraph assets.
    remotePatterns: [
      { protocol: "https", hostname: "**.graphassets.com" },
      { protocol: "https", hostname: "media.graphassets.com" },
    ],
  },
};

export default nextConfig;
