/** @type {import('next').NextConfig} */
const nextConfig = {
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
      allowedOrigins: ['reifen.bereifung24.de', 'localhost:3000'],
    },
  },
}

module.exports = nextConfig
