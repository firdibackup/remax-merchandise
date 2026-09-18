import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/gifts",
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Image uploads flow through the `uploadAsset` server action; the default
      // 1 MB body cap must cover the largest allowed upload (products = 10 MB).
      bodySizeLimit: "12mb",
      // Served at remax.co.id/gifts via a reverse proxy to Vercel. The proxy
      // forwards Vercel's own host in `x-forwarded-host` (not remax.co.id), so
      // the Server Action CSRF check sees Origin=remax.co.id ≠ Host=<vercel> and
      // rejects every action in production ("An error occurred in the Server
      // Components render"). Allowing the public host fixes it. Add the browser-
      // facing host, not the internal Vercel one.
      allowedOrigins: ["remax.co.id", "www.remax.co.id"],
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**.graphassets.com" },
      { protocol: "https", hostname: "media.graphassets.com" },
    ],
  },
};

export default nextConfig;
