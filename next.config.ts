import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Proxy mode (production): the browser calls /api/v1 on this origin and Next forwards
  // to the backend, so auth cookies are first-party. Unset locally (direct mode).
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    return target
      ? [{ source: "/api/v1/:path*", destination: `${target}/api/v1/:path*` }]
      : [];
  },
};

export default nextConfig;
