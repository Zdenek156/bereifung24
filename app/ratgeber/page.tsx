import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import BlogOverview from './BlogOverview'

export const metadata: Metadata = {
  title: 'Reifen-Ratgeber - Tipps & Guides | Bereifung24',
  description: 'Professionelle Tipps zu Reifenwechsel, Wartung, Kosten und mehr. Ihr umfassender Ratgeber für Autoreifen von Bereifung24.',
  keywords: ['Reifenratgeber', 'Reifenwechsel', 'Autoreifen', 'Reifentipps', 'Winterreifen', 'Sommerreifen'],
  openGraph: {
    title: 'Reifen-Ratgeber | Bereifung24',
    description: 'Alles Wissenswerte über Autoreifen - von Profis erklärt',
    type: 'website',
    url: 'https://bereifung24.de/ratgeber'
  }
}

export const revalidate = 300 // Revalidate every 5 minutes

async function getRatgeberData() {
  try {
    // Get featured post (latest published)
    const featuredPost = await prisma.blogPost.findFirst({
      where: { 
        status: 'PUBLISHED',
        targetAudience: { in: ['CUSTOMER', 'BOTH'] }
      },
      orderBy: { publishedAt: 'desc' },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
            icon: true,
            color: true
          }
        },
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Get all published posts for customers
    const posts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        targetAudience: { in: ['CUSTOMER', 'BOTH'] }
      },
      orderBy: { publishedAt: 'desc' },
      take: 12,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true
          }
        },
        tags: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    })

    // Get categories with post counts
    const categories = await prisma.blogCategory.findMany({
      where: {
        posts: {
          some: {
            status: 'PUBLISHED',
            targetAudience: { in: ['CUSTOMER', 'BOTH'] }
          }
        }
      },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                status: 'PUBLISHED',
                targetAudience: { in: ['CUSTOMER', 'BOTH'] }
              }
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    // Get popular tags
    const popularTags = await prisma.blogTag.findMany({
      where: {
        posts: {
          some: {
            status: 'PUBLISHED',
            targetAudience: { in: ['CUSTOMER', 'BOTH'] }
          }
        }
      },
      orderBy: { usageCount: 'desc' },
      take: 15
    })

    return {
      featuredPost,
      posts,
      categories,
      popularTags
    }
  } catch (error) {
    console.error('Error fetching ratgeber data:', error)
    return {
      featuredPost: null,
      posts: [],
      categories: [],
      popularTags: []
    }
  }
}

export default async function RatgeberPage() {
  const data = await getRatgeberData()

  return <BlogOverview {...data} />
}
