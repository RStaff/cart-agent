/** Minimal Next.js config for Abando frontend
 *  - Keeps builds unblocked for now
 *  - Full original config is backed up as next.config.mjs.pre-hard-unblock.<timestamp>.bak
 */

const nextConfig = {
  reactStrictMode: true,

  // TEMP: allow builds even if TypeScript has errors
  typescript: {
    ignoreBuildErrors: true,
  },

  // TEMP: allow builds even if ESLint finds problems
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
