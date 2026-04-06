import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import * as socialMediaService from '@/lib/social-media/socialMediaService'

// GET /api/admin/social-media/posts/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const post = await socialMediaService.getPost(params.id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

// PUT /api/admin/social-media/posts/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const body = await req.json()
    // Convert scheduledAt string to Date object for Prisma
    if (body.scheduledAt) {
      body.scheduledAt = new Date(body.scheduledAt)
    }
    const post = await socialMediaService.updatePost(params.id, body)
    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

// DELETE /api/admin/social-media/posts/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    await socialMediaService.deletePost(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
