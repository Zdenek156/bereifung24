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
  },
  // Fix for HTTPS behind reverse proxy
  experimental: {
    serverActions: {
      allowedOrigins: ['www.bereifung24.de', 'bereifung24.de', 'reifen.bereifung24.de', 'localhost:3000'],
    },
    instrumentationHook: true,
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
