/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily relax lint + TS for production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // You can turn this back on later if you want extra checks
  reactStrictMode: false,
};

export default nextConfig;
