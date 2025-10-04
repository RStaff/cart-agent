/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  
    // Keep your monorepo warning quieting
    outputFileTracingRoot: "/Users/rossstafford/projects/cart-agent/abando-frontend",
    // (Optional) keep defaults lean; add flags here if you intend to
  
};

export default nextConfig;
