import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// PATCH - Task bearbeiten (nur eigene, außer CEO)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        applications: {
          where: { applicationKey: 'roadmap' },
          select: { canEditTasks: true }
        }
      }
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const task = await prisma.roadmapTask.findUnique({
      where: { id: params.id },
      select: { assignedToId: true }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const isCEO = currentEmployee.position === 'Geschäftsführer'
    const canEdit = currentEmployee.applications[0]?.canEditTasks || isCEO
    const isOwnTask = task.assignedToId === currentEmployee.id

    // Mitarbeiter können IMMER ihre eigenen Tasks bearbeiten
    // Andere Tasks nur mit Permission oder als CEO
    if (!isOwnTask && !canEdit && !isCEO) {
      return NextResponse.json({ error: 'No permission to edit this task' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, priority, status, dueDate, category, notes, blockedReason } = body

    const updated = await prisma.roadmapTask.update({
      where: { id: params.id },
      data: {
        title,
        description,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        category,
        notes,
        blockedReason: status === 'BLOCKED' ? blockedReason : null,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        completedById: status === 'COMPLETED' ? currentEmployee.id : null
      }
    })

    return NextResponse.json({ success: true, data: updated })

  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE - Task löschen (nur eigene, außer CEO)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentEmployee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email },
      select: { id: true, position: true }
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const task = await prisma.roadmapTask.findUnique({
      where: { id: params.id },
      select: { assignedToId: true, createdById: true }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const isCEO = currentEmployee.position === 'Geschäftsführer'
    const isCreator = task.createdById === currentEmployee.id

    if (!isCreator && !isCEO) {
      return NextResponse.json({ error: 'No permission to delete this task' }, { status: 403 })
    }

    await prisma.roadmapTask.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
