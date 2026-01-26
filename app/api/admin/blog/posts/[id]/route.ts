import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

// GET /api/admin/blog/posts/[id] - Get single post
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const post = await prisma.blogPost.findUnique({
      where: { id: params.id },
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
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        tags: true,
        relatedPosts: {
          include: {
            category: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        },
        revisions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            author: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            blogViews: true,
            revisions: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: post
    })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/blog/posts/[id] - Update post
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      scheduledFor,
      changeNote
    } = body

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id: params.id }
    })

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if slug is taken by another post
    if (slug && slug !== existingPost.slug) {
      const slugTaken = await prisma.blogPost.findFirst({
        where: {
          slug,
          id: { not: params.id }
        }
      })

      if (slugTaken) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    // Handle tags
    let tagIds: string[] = []
    if (tags && Array.isArray(tags)) {
      // Disconnect old tags and decrement their usage count
      const currentTags = await prisma.blogPost.findUnique({
        where: { id: params.id },
        include: { tags: true }
      })

      if (currentTags) {
        await prisma.blogTag.updateMany({
          where: { id: { in: currentTags.tags.map(t => t.id) } },
          data: { usageCount: { decrement: 1 } }
        })
      }

      // Get or create new tags
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

    // Calculate reading time if content changed
    let readTime = existingPost.readTime
    if (content && content !== existingPost.content) {
      const wordCount = content.split(/\s+/).length
      readTime = Math.ceil(wordCount / 200)
    }

    // Update post
    const updatedPost = await prisma.blogPost.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(excerpt && { excerpt }),
        ...(content && { content }),
        ...(categoryId && { categoryId }),
        ...(targetAudience && { targetAudience }),
        ...(status && { status }),
        ...(featuredImage !== undefined && { featuredImage }),
        ...(imageAlt && { imageAlt }),
        ...(metaTitle && { metaTitle }),
        ...(metaDescription && { metaDescription }),
        ...(keywords && { keywords }),
        ...(canonicalUrl !== undefined && { canonicalUrl }),
        ...(focusKeyword && { focusKeyword }),
        readTime,
        ...(scheduledFor !== undefined && {
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null
        }),
        ...(status === 'PUBLISHED' && !existingPost.publishedAt && {
          publishedAt: new Date()
        }),
        ...(tags && {
          tags: {
            set: [],
            connect: tagIds.map(id => ({ id }))
          }
        })
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

    // Create revision if content changed
    if (title || content || excerpt) {
      await prisma.blogPostRevision.create({
        data: {
          postId: params.id,
          title: title || existingPost.title,
          content: content || existingPost.content,
          excerpt: excerpt || existingPost.excerpt,
          authorId: (session as any).user.id,
          changeNote: changeNote || 'Updated content'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedPost,
      message: 'Post updated successfully'
    })
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/blog/posts/[id] - Delete post
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    // Check if post exists
    const post = await prisma.blogPost.findUnique({
      where: { id: params.id },
      include: { tags: true }
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Decrement tag usage counts
    if (post.tags.length > 0) {
      await prisma.blogTag.updateMany({
        where: { id: { in: post.tags.map(t => t.id) } },
        data: { usageCount: { decrement: 1 } }
      })
    }

    // Delete post (cascade will delete views and revisions)
    await prisma.blogPost.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
