import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@doctorproject/react"],
  // Preserve @ alias for src/ during migration, then update to root-relative
};

export default nextConfig;
