import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

// POST /api/admin/blog/posts/[id]/archive - Archive post
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

    if (post.status === 'ARCHIVED') {
      return NextResponse.json(
        { success: false, error: 'Post is already archived' },
        { status: 400 }
      )
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id: params.id },
      data: {
        status: 'ARCHIVED'
      },
      include: {
        category: true,
        tags: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedPost,
      message: 'Post archived successfully'
    })
  } catch (error) {
    console.error('Error archiving post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to archive post' },
      { status: 500 }
    )
  }
}
