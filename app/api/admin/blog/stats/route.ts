import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

// GET /api/admin/blog/stats - Get blog statistics
export async function GET(req: NextRequest) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    // Get counts by status
    const [
      totalPosts,
      publishedCount,
      draftCount,
      reviewCount,
      archivedCount,
      totalCategories,
      totalTags,
      totalViews
    ] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
      prisma.blogPost.count({ where: { status: 'DRAFT' } }),
      prisma.blogPost.count({ where: { status: 'REVIEW' } }),
      prisma.blogPost.count({ where: { status: 'ARCHIVED' } }),
      prisma.blogCategory.count(),
      prisma.blogTag.count(),
      prisma.blogView.count()
    ])

    // Get views in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const viewsLast30Days = await prisma.blogView.count({
      where: {
        viewedAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    // Get recent posts
    const recentPosts = await prisma.blogPost.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        category: {
          select: {
            name: true,
            icon: true,
            color: true
          }
        },
        _count: {
          select: { blogViews: true }
        }
      }
    })

    // Get top viewed posts (last 30 days)
    const topPosts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        blogViews: {
          some: {
            viewedAt: {
              gte: thirtyDaysAgo
            }
          }
        }
      },
      include: {
        category: {
          select: {
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            blogViews: true
          }
        }
      },
      orderBy: {
        views: 'desc'
      },
      take: 5
    })

    // Get posts by category
    const postsByCategory = await prisma.blogCategory.findMany({
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      },
      orderBy: {
        posts: {
          _count: 'desc'
        }
      },
      take: 10
    })

    // Get most used tags
    const topTags = await prisma.blogTag.findMany({
      orderBy: { usageCount: 'desc' },
      take: 10,
      include: {
        _count: {
          select: { posts: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalPosts,
          publishedCount,
          draftCount,
          reviewCount,
          archivedCount,
          totalCategories,
          totalTags,
          totalViews,
          viewsLast30Days
        },
        recentPosts,
        topPosts,
        postsByCategory,
        topTags
      }
    })
  } catch (error) {
    console.error('Error fetching blog stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog statistics' },
      { status: 500 }
    )
  }
}
