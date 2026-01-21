import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Alle Tasks holen
    const tasks = await prisma.roadmapTask.findMany({
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        phase: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Statistiken pro Mitarbeiter
    const employeeStats = await prisma.b24Employee.findMany({
      where: {
        assignedRoadmapTasks: {
          some: {}
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        assignedRoadmapTasks: {
          select: {
            status: true,
            priority: true
          }
        }
      }
    })

    const stats = employeeStats.map(emp => {
      const tasks = emp.assignedRoadmapTasks
      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        total: tasks.length,
        notStarted: tasks.filter(t => t.status === 'NOT_STARTED').length,
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        completed: tasks.filter(t => t.status === 'COMPLETED').length,
        blocked: tasks.filter(t => t.status === 'BLOCKED').length,
        progress: Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100) || 0
      }
    })

    // Statistiken pro Phase
    const phases = await prisma.roadmapPhase.findMany({
      include: {
        tasks: {
          select: {
            status: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    const phaseStats = phases
      .filter(phase => phase && phase.color) // Nur Phasen mit gültiger Farbe
      .map(phase => ({
        id: phase.id,
        name: phase.name,
        color: phase.color,
        total: phase.tasks.length,
        completed: phase.tasks.filter(t => t.status === 'COMPLETED').length,
        progress: Math.round((phase.tasks.filter(t => t.status === 'COMPLETED').length / phase.tasks.length) * 100) || 0
      }))

    // Gesamtstatistiken
    const totalStats = {
      total: tasks.length,
      notStarted: tasks.filter(t => t.status === 'NOT_STARTED').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length,
      blocked: tasks.filter(t => t.status === 'BLOCKED').length,
      p0: tasks.filter(t => t.priority === 'P0_CRITICAL').length,
      p1: tasks.filter(t => t.priority === 'P1_HIGH').length,
      p2: tasks.filter(t => t.priority === 'P2_MEDIUM').length,
      p3: tasks.filter(t => t.priority === 'P3_LOW').length,
    }

    return NextResponse.json({
      success: true,
      data: {
        employees: stats,
        phases: phaseStats,
        total: totalStats
      }
    })

  } catch (error) {
    console.error('Error fetching roadmap stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
