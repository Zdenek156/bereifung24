import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RoadmapTaskStatus } from '@prisma/client'

/**
 * GET /api/admin/roadmap/tasks/[id]
 * Get single roadmap task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const task = await prisma.roadmapTask.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        phase: true,
        completedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: task
    })
  } catch (error) {
    console.error('Error fetching roadmap task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roadmap task' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/roadmap/tasks/[id]
 * Update roadmap task
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      notes,
      blockedReason,
      order
    } = body

    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId
    if (phaseId !== undefined) updateData.phaseId = phaseId
    if (month !== undefined) updateData.month = month
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags
    if (notes !== undefined) updateData.notes = notes
    if (blockedReason !== undefined) updateData.blockedReason = blockedReason
    if (order !== undefined) updateData.order = order

    // Handle status changes
    if (status !== undefined) {
      updateData.status = status
      
      if (status === RoadmapTaskStatus.COMPLETED) {
        updateData.completedAt = new Date()
        updateData.completedById = session.user.id
        updateData.blockedReason = null
      } else if (status === RoadmapTaskStatus.IN_PROGRESS) {
        updateData.completedAt = null
        updateData.completedById = null
      } else if (status === RoadmapTaskStatus.NOT_STARTED) {
        updateData.completedAt = null
        updateData.completedById = null
        updateData.blockedReason = null
      }
    }

    const task = await prisma.roadmapTask.update({
      where: { id: params.id },
      data: updateData,
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
      }
    })

    return NextResponse.json({
      success: true,
      data: task
    })
  } catch (error) {
    console.error('Error updating roadmap task:', error)
    return NextResponse.json(
      { error: 'Failed to update roadmap task' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/roadmap/tasks/[id]
 * Delete roadmap task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.roadmapTask.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting roadmap task:', error)
    return NextResponse.json(
      { error: 'Failed to delete roadmap task' },
      { status: 500 }
    )
  }
}
