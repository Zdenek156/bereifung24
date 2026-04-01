import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = 'https://bereifung24.de'
  const now = new Date().toISOString()

  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/suche', priority: '0.9', changefreq: 'daily' },
    { path: '/pricing', priority: '0.8', changefreq: 'monthly' },
    { path: '/karriere', priority: '0.7', changefreq: 'weekly' },
    { path: '/app-download', priority: '0.7', changefreq: 'monthly' },
    { path: '/faq', priority: '0.6', changefreq: 'monthly' },
    { path: '/support', priority: '0.6', changefreq: 'monthly' },
    { path: '/workshop-benefits', priority: '0.6', changefreq: 'monthly' },
    { path: '/smart-tire-advisor', priority: '0.7', changefreq: 'monthly' },
    { path: '/reifen-kaufen', priority: '0.8', changefreq: 'weekly' },
    { path: '/reifen-einlagern', priority: '0.7', changefreq: 'monthly' },
    { path: '/reifenservice', priority: '0.7', changefreq: 'monthly' },
    { path: '/impressum', priority: '0.3', changefreq: 'yearly' },
    { path: '/datenschutz', priority: '0.3', changefreq: 'yearly' },
    { path: '/agb', priority: '0.3', changefreq: 'yearly' },
  ]

  const servicePages = [
    '/services/reifenwechsel',
    '/services/raederwechsel',
    '/services/achsvermessung',
    '/services/klimaservice',
    '/services/motorradreifen',
    '/services/reifenreparatur',
  ]

  const urls = staticPages
    .map(
      (page) => `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('\n')

  const serviceUrls = servicePages
    .map(
      (path) => `  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
${serviceUrls}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  })
}
