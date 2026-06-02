import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pg"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["recharts", "lucide-react", "date-fns"],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
