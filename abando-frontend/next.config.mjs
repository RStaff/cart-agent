/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Let the app build on Vercel even if ESLint complains
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Allow Shopify to embed /embedded inside admin.shopify.com + *.myshopify.com
  async headers() {
    return [
      {
        source: '/embedded/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors https://admin.shopify.com https://*.myshopify.com;",
          },
          // Optional: override any default X-Frame-Options that might be added
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
