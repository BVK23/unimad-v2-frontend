import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: false,
  // Turbopack-specific options
  turbopack: {
    root: __dirname,
    // `pdfjs-dist` can pull optional Node canvas paths; force browser-safe shim
    resolveAlias: {
      canvas: "./src/lib/shims/canvas.ts",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  webpack: config => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Keep webpack behavior aligned with Turbopack aliasing
      canvas: false,
    };

    return config;
  },
  async redirects() {
    return [
      { source: "/uniboard", destination: "/uniboard/resume", permanent: true },
      { source: "/uniboard/home", destination: "/uniboard/resume", permanent: false },
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/tos", destination: "/terms", permanent: true },
      {
        source: "/uniboard/portfolio/masterclass",
        destination: "/masterclass",
        permanent: true,
      },
      {
        source: "/uniboard/masterclass",
        destination: "/masterclass",
        permanent: true,
      },
      {
        source: "/webinar",
        destination: "/masterclass",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
