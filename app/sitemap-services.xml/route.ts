import { NextResponse } from 'next/server'
import { getAllServiceCityPaths, SERVICES } from '@/lib/seo/service-city-pages'

export async function GET() {
  const baseUrl = 'https://bereifung24.de'
  const now = new Date().toISOString()
  const paths = getAllServiceCityPaths()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${paths.map(({ service, city }) => `
  <url>
    <loc>${baseUrl}/${service}/${city}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate'
    }
  })
}
