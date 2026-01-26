import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Generate XML sitemap for blog posts
 * GET /sitemap-blog.xml
 */
export async function GET() {
  try {
    // Get all published blog posts
    const posts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    })

    // Get all categories with published posts
    const categories = await prisma.blogCategory.findMany({
      where: {
        posts: {
          some: {
            status: 'PUBLISHED'
          }
        }
      },
      select: {
        slug: true,
        updatedAt: true
      }
    })

    const baseUrl = 'https://bereifung24.de'

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  
  <!-- Blog Overview -->
  <url>
    <loc>${baseUrl}/ratgeber</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Blog Posts -->
${posts
  .map(
    post => `  <url>
    <loc>${baseUrl}/ratgeber/${post.slug}</loc>
    <lastmod>${post.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('\n')}

  <!-- Blog Categories -->
${categories
  .map(
    category => `  <url>
    <loc>${baseUrl}/ratgeber?category=${category.slug}</loc>
    <lastmod>${category.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join('\n')}

</urlset>`

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      {
        status: 500,
        headers: {
          'Content-Type': 'application/xml'
        }
      }
    )
  }
}
