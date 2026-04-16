import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: "/profile", destination: "/dashboard", permanent: true }];
  },
};

export default nextConfig;
