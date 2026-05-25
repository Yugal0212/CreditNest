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
      handler: 'NetworkFirst',
      options: {
        cacheName: 'scms-api-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
        networkTimeoutSeconds: 10,
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
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      }
    ],
  },
};

export default withPWA(nextConfig);
