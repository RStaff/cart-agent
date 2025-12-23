/** @type {import('next').NextConfig} */
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  turbopack: { root: __dirname },
  async rewrites() {
    const apiOrigin =
      process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:3000";

    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
