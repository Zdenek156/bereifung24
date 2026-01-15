import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/sales/prospects/[id]/activities
 * Returns all activities (timeline) for a prospect
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const googlePlaceId = params.id

    // Find prospect
    const prospect = await prisma.prospectWorkshop.findUnique({
      where: { googlePlaceId }
    })

    if (!prospect) {
      // Return empty activities if prospect doesn't exist yet
      return NextResponse.json({ activities: [] })
    }

    // Fetch all activities
    const [notes, tasks, interactions] = await Promise.all([
      // Notes
      prisma.prospectNote.findMany({
        where: { prospectId: prospect.id },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Tasks
      prisma.prospectTask.findMany({
        where: { prospectId: prospect.id },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Interactions (if exists)
      prisma.prospectInteraction.findMany({
        where: { prospectId: prospect.id },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }).catch(() => []) // Table might not exist yet
    ])

    // Combine and format all activities
    const activities = [
      ...notes.map(note => ({
        id: note.id,
        type: 'NOTE' as const,
        title: 'Notiz hinzugefügt',
        description: note.content,
        createdBy: note.createdBy,
        createdAt: note.createdAt,
        icon: '📝'
      })),

      ...tasks.map(task => ({
        id: task.id,
        type: 'TASK' as const,
        title: `Aufgabe erstellt: ${task.title}`,
        description: task.description || `Zugewiesen an: ${task.assignedTo.firstName} ${task.assignedTo.lastName}`,
        status: task.status,
        priority: task.priority,
        createdBy: task.createdBy,
        createdAt: task.createdAt,
        icon: task.status === 'COMPLETED' ? '✅' : task.status === 'IN_PROGRESS' ? '⏳' : '📋'
      })),

      ...interactions.map(interaction => ({
        id: interaction.id,
        type: interaction.type,
        title: `${interaction.type === 'EMAIL' ? 'E-Mail' : interaction.type === 'CALL' ? 'Anruf' : 'Interaktion'}`,
        description: interaction.notes,
        createdBy: interaction.createdBy,
        createdAt: interaction.createdAt,
        icon: interaction.type === 'EMAIL' ? '📧' : interaction.type === 'CALL' ? '📞' : '💬'
      }))
    ]

    // Sort by date (most recent first)
    activities.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({ activities })

  } catch (error) {
    console.error('Error fetching prospect activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
