import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose", "playwright-core"],
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
