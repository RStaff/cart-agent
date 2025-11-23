/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow build to succeed even if ESLint finds problems
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow build to succeed even if TS finds type errors
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
