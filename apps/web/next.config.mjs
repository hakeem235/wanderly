/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    typedRoutes: false,
  },
  transpilePackages: ["@wanderly/ui", "@wanderly/db"],
  webpack(config) {
    // aws4 is an optional MongoDB peer dep (AWS auth) — not needed in app
    config.resolve.fallback = { ...config.resolve.fallback, aws4: false };
    return config;
  },
};

export default nextConfig;
