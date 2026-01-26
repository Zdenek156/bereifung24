import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { BlogStatus, BlogAudience } from '@prisma/client'

// GET /api/admin/blog/posts - List all posts with filters and pagination
export async function GET(req: NextRequest) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') as BlogStatus | null
    const categoryId = searchParams.get('categoryId')
    const audience = searchParams.get('audience') as BlogAudience | null
    const search = searchParams.get('search')
    const authorId = searchParams.get('authorId')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (audience) {
      where.targetAudience = audience
    }
    
    if (authorId) {
      where.authorId = authorId
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get posts with pagination
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
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
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
              usageCount: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              blogViews: true,
              revisions: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { updatedAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.blogPost.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST /api/admin/blog/posts - Create new post
export async function POST(req: NextRequest) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const session = await requireAdminOrEmployee()
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const {
      title,
      slug,
      excerpt,
      content,
      categoryId,
      tags,
      targetAudience,
      status,
      featuredImage,
      imageAlt,
      metaTitle,
      metaDescription,
      keywords,
      canonicalUrl,
      focusKeyword,
      scheduledFor
    } = body

    // Validate required fields
    if (!title || !slug || !content || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, slug, content, categoryId' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug }
    })

    if (existingPost) {
      return NextResponse.json(
        { success: false, error: 'Slug already exists' },
        { status: 400 }
      )
    }

    // Get or create tags
    const tagIds: string[] = []
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        const tag = await prisma.blogTag.upsert({
          where: { slug: tagName.toLowerCase().replace(/\s+/g, '-') },
          update: { usageCount: { increment: 1 } },
          create: {
            name: tagName,
            slug: tagName.toLowerCase().replace(/\s+/g, '-'),
            usageCount: 1
          }
        })
        tagIds.push(tag.id)
      }
    }

    // Calculate reading time (words per minute: 200)
    const wordCount = content.split(/\s+/).length
    const readTime = Math.ceil(wordCount / 200)

    // Create post
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: excerpt || content.substring(0, 160),
        content,
        categoryId,
        targetAudience: targetAudience || 'CUSTOMER',
        status: status || 'DRAFT',
        featuredImage,
        imageAlt,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt || content.substring(0, 160),
        keywords: keywords || [],
        canonicalUrl,
        focusKeyword,
        readTime,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        authorId: (session as any).user.id,
        tags: {
          connect: tagIds.map(id => ({ id }))
        }
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        tags: true
      }
    })

    // Create initial revision
    await prisma.blogPostRevision.create({
      data: {
        postId: post.id,
        title,
        content,
        excerpt: excerpt || content.substring(0, 160),
        authorId: (session as any).user.id,
        changeNote: 'Initial version'
      }
    })

    return NextResponse.json({
      success: true,
      data: post,
      message: 'Post created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
