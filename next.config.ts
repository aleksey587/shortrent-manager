import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: '/callisto',
        destination: '/callisto/index.html',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/clean-cookies',
        headers: [
          {
            key: 'Clear-Site-Data',
            value: '"cookies", "storage"',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
