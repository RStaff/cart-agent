import { fileURLToPath } from "url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESM-safe "dirname"
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },

  reactStrictMode: true,

  // Allow Shopify to embed /embedded inside admin.shopify.com + *.myshopify.com
  async headers() {
    return [
      {
        source: "/embedded/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors https://admin.shopify.com https://*.myshopify.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
