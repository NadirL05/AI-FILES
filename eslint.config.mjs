import { defineConfig } from "eslint/config";
import nextConfig from "eslint-config-next/core-web-vitals.js";

export default defineConfig([
  ...(Array.isArray(nextConfig) ? nextConfig : [nextConfig]),
]);
