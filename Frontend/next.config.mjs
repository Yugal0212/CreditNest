import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: { document: '/offline' },
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/.*\/(api)\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'scms-api-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
        backgroundSync: {
          name: 'scms-api-sync',
          options: {
            maxRetentionTime: 24 * 60 // Retry for up to 24 hours if offline
          }
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'scms-image-cache',
        expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 }, // 30 days
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /\.(?:js|css|woff2?|eot|ttf|otf)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'scms-static-resources',
        expiration: { maxEntries: 200, maxAgeSeconds: 365 * 24 * 60 * 60 }, // 1 year
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'scms-offline-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // cache optimized images for 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
};

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(withPWA(nextConfig));
