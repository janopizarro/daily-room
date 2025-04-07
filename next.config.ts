import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ⛔️ desactiva errores eslint al hacer build
  },
};

export default nextConfig;
