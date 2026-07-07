import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles deployment natively — don't use standalone output on Vercel.
  // Only enable standalone for self-hosted (Docker/VPS) via env var.
  ...(process.env.SELF_HOSTED === "true" ? { output: "standalone" } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
