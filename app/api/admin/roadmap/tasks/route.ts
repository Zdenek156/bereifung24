import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RoadmapTaskPriority, RoadmapTaskStatus } from '@prisma/client'

/**
 * GET /api/admin/roadmap/tasks
 * Get all roadmap tasks with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assignedToId = searchParams.get('assignedToId')
    const phaseId = searchParams.get('phaseId')
    const priority = searchParams.get('priority') as RoadmapTaskPriority | null
    const status = searchParams.get('status') as RoadmapTaskStatus | null
    const month = searchParams.get('month')
    const category = searchParams.get('category')

    const where: any = {}
    
    if (assignedToId) where.assignedToId = assignedToId
    if (phaseId) where.phaseId = phaseId
    if (priority) where.priority = priority
    if (status) where.status = status
    if (month) where.month = month
    if (category) where.category = category

    const tasks = await prisma.roadmapTask.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        phase: {
          select: {
            id: true,
            name: true,
            color: true,
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
        { dueDate: 'asc' },
        { order: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: tasks
    })
  } catch (error) {
    console.error('Error fetching roadmap tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roadmap tasks' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/roadmap/tasks
 * Create new roadmap task
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      priority,
      status,
      assignedToId,
      phaseId,
      month,
      dueDate,
      startDate,
      category,
      tags,
      notes
    } = body

    if (!title || !priority || !phaseId || !month) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get max order for this phase
    const maxTask = await prisma.roadmapTask.findFirst({
      where: { phaseId },
      orderBy: { order: 'desc' }
    })
    const nextOrder = (maxTask?.order || 0) + 1

    const task = await prisma.roadmapTask.create({
      data: {
        title,
        description,
        priority,
        status: status || RoadmapTaskStatus.NOT_STARTED,
        assignedToId,
        phaseId,
        month,
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        category,
        tags: tags || [],
        notes,
        order: nextOrder,
        createdById: session.user.id
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        phase: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: task
    })
  } catch (error) {
    console.error('Error creating roadmap task:', error)
    return NextResponse.json(
      { error: 'Failed to create roadmap task' },
      { status: 500 }
    )
  }
}
