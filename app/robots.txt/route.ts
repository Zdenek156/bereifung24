import { NextResponse } from 'next/server'

export async function GET() {
  const robotsTxt = `# https://bereifung24.de/robots.txt

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/admin/
Disallow: /employee/
Disallow: /api/auth/

Sitemap: https://bereifung24.de/sitemap.xml
Sitemap: https://bereifung24.de/sitemap-blog.xml
`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate'
    }
  })
}
