/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const RENDER = process.env.ABANDO_RENDER_API_BASE || "https://cart-agent-api.onrender.com";
    return [
      { source: "/api/auth/:path*", destination: `${RENDER}/api/auth/:path*` },
      { source: "/api/webhooks/:path*", destination: `${RENDER}/api/webhooks/:path*` },
      { source: "/shopify/:path*", destination: `${RENDER}/shopify/:path*` }
    ];
  }
};

module.exports = nextConfig;
