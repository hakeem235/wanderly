/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    typedRoutes: false,
  },
  // Transpile workspace packages
  transpilePackages: ["@wanderly/ui", "@wanderly/db"],
};

export default nextConfig;
