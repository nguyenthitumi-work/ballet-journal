import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN devices (phone, tablet) to use the dev server. Next 16 blocks
  // cross-origin requests to dev-only endpoints by default, which breaks
  // Server Actions when the page is loaded via a non-localhost host.
  allowedDevOrigins: ['192.168.1.136', '192.168.1.*'],
};

export default nextConfig;
