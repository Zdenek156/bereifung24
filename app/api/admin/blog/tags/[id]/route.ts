import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

// GET /api/admin/blog/tags/[id] - Get single tag
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const tag = await prisma.blogTag.findUnique({
      where: { id: params.id },
      include: {
        posts: {
          where: { status: 'PUBLISHED' },
          select: {
            id: true,
            title: true,
            slug: true,
            publishedAt: true,
            category: {
              select: {
                name: true,
                slug: true
              }
            }
          },
          orderBy: { publishedAt: 'desc' },
          take: 20
        },
        _count: {
          select: { posts: true }
        }
      }
    })

    if (!tag) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tag
    })
  } catch (error) {
    console.error('Error fetching tag:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tag' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/blog/tags/[id] - Update tag
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const body = await req.json()
    const { name, slug } = body

    // Check if tag exists
    const existingTag = await prisma.blogTag.findUnique({
      where: { id: params.id }
    })

    if (!existingTag) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      )
    }

    // Check if slug is taken by another tag
    if (slug && slug !== existingTag.slug) {
      const slugTaken = await prisma.blogTag.findFirst({
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

    const updatedTag = await prisma.blogTag.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(slug && { slug })
      },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedTag,
      message: 'Tag updated successfully'
    })
  } catch (error) {
    console.error('Error updating tag:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update tag' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/blog/tags/[id] - Delete tag
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    // Check if tag exists
    const tag = await prisma.blogTag.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    })

    if (!tag) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      )
    }

    // Prevent deletion if tag has posts
    if (tag._count.posts > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete tag with ${tag._count.posts} posts. Please remove tag from posts first.`
        },
        { status: 400 }
      )
    }

    await prisma.blogTag.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Tag deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete tag' },
      { status: 500 }
    )
  }
}
