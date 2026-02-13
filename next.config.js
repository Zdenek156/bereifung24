/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Generate unique build ID to prevent aggressive caching
  generateBuildId: async () => {
    // Use timestamp to ensure new build ID on every deployment
    return `build-${Date.now()}`
  },
  // Fix for HTTPS behind reverse proxy
  experimental: {
    serverActions: {
      allowedOrigins: ['www.bereifung24.de', 'bereifung24.de', 'reifen.bereifung24.de', 'localhost:3000'],
    },
    instrumentationHook: true,
  },
  // Configure cache headers to prevent aggressive browser caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/mitarbeiter/eprel',
        destination: '/admin/eprel',
      },
      {
        source: '/mitarbeiter/:path*',
        destination: '/admin/:path*',
      },
    ]
  },
}

module.exports = nextConfig
