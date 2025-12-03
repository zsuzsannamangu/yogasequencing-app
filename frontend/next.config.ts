import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/silhouettes/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/silhouettes/**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'production' ? false : true, // Allow unoptimized in dev for flexibility
  },
};

export default nextConfig;
