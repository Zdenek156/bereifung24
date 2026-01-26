import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

// GET /api/admin/blog/categories - List all categories
export async function GET(req: NextRequest) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const { searchParams } = new URL(req.url)
    const includeHierarchy = searchParams.get('hierarchy') === 'true'

    if (includeHierarchy) {
      // Get only top-level categories with their children
      const categories = await prisma.blogCategory.findMany({
        where: { parentId: null },
        include: {
          children: {
            orderBy: { sortOrder: 'asc' },
            include: {
              _count: {
                select: { posts: true }
              }
            }
          },
          _count: {
            select: { posts: true }
          }
        },
        orderBy: { sortOrder: 'asc' }
      })

      return NextResponse.json({
        success: true,
        data: categories
      })
    } else {
      // Get all categories flat
      const categories = await prisma.blogCategory.findMany({
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              posts: true,
              children: true
            }
          }
        },
        orderBy: { sortOrder: 'asc' }
      })

      return NextResponse.json({
        success: true,
        data: categories
      })
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/admin/blog/categories - Create new category
export async function POST(req: NextRequest) {
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

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, slug' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingCategory = await prisma.blogCategory.findUnique({
      where: { slug }
    })

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Slug already exists' },
        { status: 400 }
      )
    }

    // Validate parent exists if parentId provided
    if (parentId) {
      const parent = await prisma.blogCategory.findUnique({
        where: { id: parentId }
      })

      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Parent category not found' },
          { status: 400 }
        )
      }
    }

    const category = await prisma.blogCategory.create({
      data: {
        name,
        slug,
        description,
        icon,
        color,
        parentId,
        seoTitle: seoTitle || name,
        seoDescription: seoDescription || description,
        sortOrder: sortOrder || 999
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
      data: category,
      message: 'Category created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
