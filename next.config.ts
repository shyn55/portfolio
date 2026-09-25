import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Local images: everything under /images (site assets, certificate) and
    // /uploads (dev-mode admin uploads). `search` is omitted on purpose so a
    // cache-busting query string (certificate uses ?v=2) stays allowed.
    localPatterns: [{ pathname: "/images/**" }, { pathname: "/uploads/**" }],
    // Project images can be local paths (/images/...) or any http(s) URL the
    // admin enters (Vercel Blob, S3, GitHub raw, ...). next/image still serves
    // them optimized and sandboxed.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
};

export default nextConfig;
