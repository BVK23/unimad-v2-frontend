import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: false,
  // Resume PDFs / other FormData Server Actions can exceed the default 1MB cap.
  // Portfolio media should use GCS signed URLs; this is a safety net for remaining paths.
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions#bodysizelimit
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Turbopack-specific options
  turbopack: {
    root: __dirname,
    // `pdfjs-dist` can pull optional Node canvas paths; force browser-safe shim
    resolveAlias: {
      canvas: "./src/lib/shims/canvas.ts",
    },
  },
  images: {
    // Next 16 requires every `quality` used by <Image> to be declared here,
    // otherwise it logs a dev warning (Next 15 did not enforce this).
    qualities: [70, 75, 100],
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
