import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@social/types', '@social/validation', '@social/shared'],
  serverExternalPackages: ['ws'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
