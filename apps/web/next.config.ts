import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@jobprep/shared'],
  experimental: {
    // Turbopack or app router defaults
  },
};

export default nextConfig;
