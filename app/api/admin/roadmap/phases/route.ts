import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/roadmap/phases
 * Get all roadmap phases with tasks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const phases = await prisma.roadmapPhase.findMany({
      where: { isActive: true },
      include: {
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            completedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: [
            { priority: 'asc' },
            { order: 'asc' },
            { dueDate: 'asc' }
          ]
        }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: phases
    })
  } catch (error) {
    console.error('Error fetching roadmap phases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roadmap phases' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/roadmap/phases
 * Create new roadmap phase
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, startMonth, endMonth, color } = body

    if (!name || !startMonth || !endMonth) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get max order
    const maxPhase = await prisma.roadmapPhase.findFirst({
      orderBy: { order: 'desc' }
    })
    const nextOrder = (maxPhase?.order || 0) + 1

    const phase = await prisma.roadmapPhase.create({
      data: {
        name,
        description,
        startMonth,
        endMonth,
        color: color || '#3B82F6',
        order: nextOrder
      },
      include: {
        tasks: true
      }
    })

    return NextResponse.json({
      success: true,
      data: phase
    })
  } catch (error) {
    console.error('Error creating roadmap phase:', error)
    return NextResponse.json(
      { error: 'Failed to create roadmap phase' },
      { status: 500 }
    )
  }
}
