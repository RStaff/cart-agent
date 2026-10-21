import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) },
  async headers() {
    return [{ source: "/(.*)", headers: [{ key: "Permissions-Policy", value: "microphone=(self)" }] }];
  },
};

export default nextConfig;
