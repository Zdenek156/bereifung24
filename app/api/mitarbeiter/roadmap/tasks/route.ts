import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// POST - Neue Task erstellen (nur mit Permission)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentEmployee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true,
        position: true,
        employeeApplications: {
          where: { applicationKey: 'roadmap' },
          select: { canCreateTasks: true }
        }
      }
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const isCEO = currentEmployee.position === 'Geschäftsführer'
    const canCreate = currentEmployee.employeeApplications[0]?.canCreateTasks || isCEO

    if (!canCreate) {
      return NextResponse.json({ error: 'No permission to create tasks' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, priority, phaseId, month, dueDate, category } = body

    const task = await prisma.roadmapTask.create({
      data: {
        title,
        description,
        priority,
        phaseId,
        month,
        dueDate: dueDate ? new Date(dueDate) : null,
        category,
        assignedToId: currentEmployee.id, // Assign to self
        createdById: currentEmployee.id,
        status: 'NOT_STARTED'
      }
    })

    return NextResponse.json({ success: true, data: task })

  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
