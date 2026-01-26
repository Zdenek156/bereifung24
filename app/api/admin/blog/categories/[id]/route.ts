import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

// GET /api/admin/blog/categories/[id] - Get single category
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const category = await prisma.blogCategory.findUnique({
      where: { id: params.id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        children: {
          orderBy: { sortOrder: 'asc' }
        },
        posts: {
          where: { status: 'PUBLISHED' },
          select: {
            id: true,
            title: true,
            slug: true,
            publishedAt: true
          },
          orderBy: { publishedAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            posts: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: category
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/blog/categories/[id] - Update category
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const body = await req.json()
    const {
      name,
      slug,
      description,
      icon,
      color,
      parentId,
      seoTitle,
      seoDescription,
      sortOrder
    } = body

    // Check if category exists
    const existingCategory = await prisma.blogCategory.findUnique({
      where: { id: params.id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if slug is taken by another category
    if (slug && slug !== existingCategory.slug) {
      const slugTaken = await prisma.blogCategory.findFirst({
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

    // Prevent circular parent-child relationships
    if (parentId) {
      if (parentId === params.id) {
        return NextResponse.json(
          { success: false, error: 'Category cannot be its own parent' },
          { status: 400 }
        )
      }

      // Check if parent exists
      const parent = await prisma.blogCategory.findUnique({
        where: { id: parentId }
      })

      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Parent category not found' },
          { status: 400 }
        )
      }

      // Check if trying to set a child as parent (would create circular reference)
      const children = await prisma.blogCategory.findMany({
        where: { parentId: params.id }
      })

      if (children.some(child => child.id === parentId)) {
        return NextResponse.json(
          { success: false, error: 'Cannot set child category as parent (circular reference)' },
          { status: 400 }
        )
      }
    }

    const updatedCategory = await prisma.blogCategory.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(icon && { icon }),
        ...(color && { color }),
        ...(parentId !== undefined && { parentId }),
        ...(seoTitle && { seoTitle }),
        ...(seoDescription && { seoDescription }),
        ...(sortOrder !== undefined && { sortOrder })
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: { posts: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/blog/categories/[id] - Delete category
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    // Check if category exists
    const category = await prisma.blogCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            posts: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Prevent deletion if category has posts
    if (category._count.posts > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category with ${category._count.posts} posts. Please reassign or delete the posts first.`
        },
        { status: 400 }
      )
    }

    // Prevent deletion if category has children
    if (category._count.children > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category with ${category._count.children} child categories. Please delete or reassign child categories first.`
        },
        { status: 400 }
      )
    }

    await prisma.blogCategory.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
