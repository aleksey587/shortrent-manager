import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
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
