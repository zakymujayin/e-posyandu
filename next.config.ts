import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pg"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
