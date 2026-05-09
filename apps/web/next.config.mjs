import withPWAInit from "@ducanh2912/next-pwa";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // Cache trip pages for offline viewing
      {
        urlPattern: /^https?:\/\/.*\/trips\/.*/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "trip-pages",
          expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      // Cache dashboard
      {
        urlPattern: /^https?:\/\/.*\/dashboard/,
        handler: "StaleWhileRevalidate",
        options: { cacheName: "dashboard", expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 } },
      },
      // Cache static assets (fonts, images)
      {
        urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      // Cache Mapbox tiles
      {
        urlPattern: /^https:\/\/api\.mapbox\.com\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "mapbox",
          expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    typedRoutes: false,
    instrumentationHook: true,
  },
  transpilePackages: ["@wanderly/ui", "@wanderly/db", "@wanderly/sdk", "@wanderly/ai"],
  webpack(config) {
    // aws4 is an optional MongoDB peer dep (AWS auth) — not needed in app
    config.resolve.fallback = { ...config.resolve.fallback, aws4: false };
    return config;
  },
};

export default withPWA(withNextIntl(nextConfig));
