import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RoadmapTaskStatus } from '@prisma/client'

/**
 * GET /api/mitarbeiter/roadmap/my-tasks
 * Get current user's assigned tasks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as RoadmapTaskStatus | null
    const month = searchParams.get('month')

    const where: any = {
      assignedToId: session.user.id
    }
    
    if (status) where.status = status
    if (month) where.month = month

    const tasks = await prisma.roadmapTask.findMany({
      where,
      include: {
        phase: {
          select: {
            id: true,
            name: true,
            color: true,
            startMonth: true,
            endMonth: true,
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

    // Filter out tasks without valid phase data
    const validTasks = tasks.filter(task => task.phase && task.phase.color)

    return NextResponse.json({
      success: true,
      data: validTasks
    })
  } catch (error) {
    console.error('Error fetching my tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch my tasks' },
      { status: 500 }
    )
  }
}
