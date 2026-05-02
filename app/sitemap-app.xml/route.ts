import { NextResponse } from 'next/server'
import { getAllAppPageSlugs } from '@/lib/seo/app-pages'
import { getAllCitySlugs } from '@/lib/seo/german-cities'

export async function GET() {
  const baseUrl = 'https://bereifung24.de'
  const now = new Date().toISOString()

  const slugs = getAllAppPageSlugs()
  const cities = getAllCitySlugs()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/app</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  ${slugs.map(slug => `<url>
    <loc>${baseUrl}/app/${slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n  ')}
  ${cities.map(city => `<url>
    <loc>${baseUrl}/app/stadt/${city}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n  ')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate'
    }
  })
}
