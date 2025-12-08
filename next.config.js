/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
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
}

module.exports = nextConfig
