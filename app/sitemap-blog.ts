import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://bereifung24.de'

  try {
    // Get all published blog posts
    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true
      },
      orderBy: { publishedAt: 'desc' }
    })

    // Get all categories with published posts
    const categories = await prisma.blogCategory.findMany({
      where: {
        posts: {
          some: { status: 'PUBLISHED' }
        }
      },
      select: {
        slug: true,
        updatedAt: true
      }
    })

    // Blog overview
    const blogRoutes: MetadataRoute.Sitemap = [
      {
        url: `${baseUrl}/ratgeber`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9
      }
    ]

    // Blog posts
    const postRoutes: MetadataRoute.Sitemap = posts.map(post => ({
      url: `${baseUrl}/ratgeber/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8
    }))

    // Blog categories
    const categoryRoutes: MetadataRoute.Sitemap = categories.map(category => ({
      url: `${baseUrl}/ratgeber?category=${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7
    }))

    return [...blogRoutes, ...postRoutes, ...categoryRoutes]
  } catch (error) {
    console.error('Error generating blog sitemap:', error)
    return [
      {
        url: `${baseUrl}/ratgeber`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9
      }
    ]
  }
}
