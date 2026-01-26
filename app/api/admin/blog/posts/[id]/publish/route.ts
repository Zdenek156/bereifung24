import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

// POST /api/admin/blog/posts/[id]/publish - Publish post
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const post = await prisma.blogPost.findUnique({
      where: { id: params.id }
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.status === 'PUBLISHED') {
      return NextResponse.json(
        { success: false, error: 'Post is already published' },
        { status: 400 }
      )
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id: params.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      },
      include: {
        category: true,
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        tags: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedPost,
      message: 'Post published successfully'
    })
  } catch (error) {
    console.error('Error publishing post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to publish post' },
      { status: 500 }
    )
  }
}
