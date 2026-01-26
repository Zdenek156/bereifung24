import { NextResponse } from 'next/server'

export async function GET() {
  const robotsTxt = `# Bereifung24.de Robots.txt
# Allow all search engines to crawl the entire site

User-agent: *
Allow: /

# Disallow admin areas
Disallow: /admin/
Disallow: /api/admin/

# Disallow employee areas
Disallow: /employee/

# Disallow private API endpoints
Disallow: /api/auth/

# Sitemaps
Sitemap: https://bereifung24.de/sitemap.xml
Sitemap: https://bereifung24.de/sitemap-blog.xml

# Crawl-delay for polite bots
Crawl-delay: 1`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400'
    }
  })
}
