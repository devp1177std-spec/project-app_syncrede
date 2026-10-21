import type { NextConfig } from 'next';
import path from 'path';
import dotenv from 'dotenv';

// Load monorepo root environment variables into Next.js runtime
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

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
