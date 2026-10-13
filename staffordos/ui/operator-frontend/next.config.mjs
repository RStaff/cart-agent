import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const staffordosRoot = path.resolve(currentDir, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  logging: {
    incomingRequests: {
      ignore: [/^\/api\/operator\/auth(?:\/|$)/],
    },
  },
  experimental: {
    externalDir: true,
  },
  turbopack: {
    root: staffordosRoot,
  },
};

export default nextConfig;
