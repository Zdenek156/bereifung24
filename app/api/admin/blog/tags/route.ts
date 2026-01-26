import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

// GET /api/admin/blog/tags - List all tags
export async function GET(req: NextRequest) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'usage' // usage | name | recent

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ]
    }

    let orderBy: any
    switch (sortBy) {
      case 'name':
        orderBy = { name: 'asc' }
        break
      case 'recent':
        orderBy = { createdAt: 'desc' }
        break
      case 'usage':
      default:
        orderBy = { usageCount: 'desc' }
        break
    }

    const tags = await prisma.blogTag.findMany({
      where,
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy
    })

    return NextResponse.json({
      success: true,
      data: tags
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

// POST /api/admin/blog/tags - Create new tag
export async function POST(req: NextRequest) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const body = await req.json()
    const { name, slug } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      )
    }

    const tagSlug = slug || name.toLowerCase().replace(/\s+/g, '-')

    // Check if slug already exists
    const existingTag = await prisma.blogTag.findUnique({
      where: { slug: tagSlug }
    })

    if (existingTag) {
      return NextResponse.json(
        { success: false, error: 'Tag with this name already exists' },
        { status: 400 }
      )
    }

    const tag = await prisma.blogTag.create({
      data: {
        name,
        slug: tagSlug,
        usageCount: 0
      },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: tag,
      message: 'Tag created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}
