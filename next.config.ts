import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to THIS project so Next.js doesn't pick the stray
  // /Users/saainadhan/package-lock.json as the root (silences the warning and
  // ensures correct module resolution).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
