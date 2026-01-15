import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET /api/employee/tasks - Aufgaben abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    // Zeige Aufgaben, die dem Mitarbeiter zugewiesen sind ODER die er erstellt hat
    const where: any = {
      OR: [
        { assignedToId: employeeId }, // Mir zugewiesene Aufgaben
        { createdById: employeeId }   // Von mir erstellte Aufgaben
      ]
    }

    if (status) {
      where.status = status
    }

    // 1. Lade EmployeeTasks (interne Aufgaben)
    const employeeTasks = await prisma.employeeTask.findMany({
      where,
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
            lastName: true,
            profileImage: true
          }
        },
        completedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        attachments: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    })

    // 2. Lade ProspectTasks (Sales-Aufgaben)
    const prospectTasks = await prisma.prospectTask.findMany({
      where,
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
            lastName: true,
            profileImage: true
          }
        },
        prospect: {
          select: {
            name: true,
            city: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    })

    // 3. Kombiniere beide Task-Typen mit category Tag
    const allTasks = [
      ...employeeTasks.map(task => ({
        ...task,
        taskType: 'EMPLOYEE',
        category: task.category || 'Intern',
        status: task.status === 'TODO' ? 'PENDING' : task.status, // Status-Mapping TODO -> PENDING
        attachments: task.attachments || [],
        comments: task.comments || [],
        progress: task.progress || 0
      })),
      ...prospectTasks.map(task => ({
        ...task,
        taskType: 'PROSPECT',
        category: 'Vertrieb',
        description: task.description ? `${task.description}\n\nProspect: ${task.prospect.name} (${task.prospect.city})` : `Prospect: ${task.prospect.name} (${task.prospect.city})`,
        attachments: [],
        comments: [],
        progress: task.status === 'COMPLETED' ? 100 : task.status === 'IN_PROGRESS' ? 50 : 0,
        completedBy: null
      }))
    ]

    // 4. Sortiere kombinierte Liste
    allTasks.sort((a, b) => {
      // Erst nach Status
      if (a.status !== b.status) {
        const statusOrder = { TODO: 0, PENDING: 0, IN_PROGRESS: 1, REVIEW: 2, BLOCKED: 3, COMPLETED: 4, CANCELLED: 5 }
        return (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0)
      }
      // Dann nach Priorität
      const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      if (a.priority !== b.priority) {
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 2)
      }
      // Dann nach Fälligkeitsdatum
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      return 0
    })

    return NextResponse.json(allTasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Aufgaben' },
      { status: 500 }
    )
  }
}

// POST /api/employee/tasks - Neue Aufgabe erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.id
    const body = await request.json()
    const {
      title,
      description,
      priority,
      dueDate,
      category,
      assignedToId
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Titel ist erforderlich' },
        { status: 400 }
      )
    }

    const task = await prisma.employeeTask.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        category,
        assignedToId: assignedToId || employeeId,
        createdById: employeeId
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Aufgabe' },
      { status: 500 }
    )
  }
}
