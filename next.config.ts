import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  turbopack: {
    resolveAlias: {
      // Yjs 중복 import 문제 해결
      yjs: "yjs",
    },
  },
};

export default nextConfig;
