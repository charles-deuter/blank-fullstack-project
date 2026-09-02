import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // This app is its own project root; prevents Next from inferring a workspace
  // root from stray lockfiles in parent directories.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
