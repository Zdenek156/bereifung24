import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

// PATCH /api/employee/tasks/[id] - Aufgabe aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.id
    const taskId = params.id
    const body = await request.json()

    // Prüfen ob Aufgabe existiert
    const task = await prisma.employeeTask.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json({ error: 'Aufgabe nicht gefunden' }, { status: 404 })
    }

    // Nur zugewiesene Person oder Ersteller darf bearbeiten
    if (task.assignedToId !== employeeId && task.createdById !== employeeId) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const updatedTask = await prisma.employeeTask.update({
      where: { id: taskId },
      data: {
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        completedAt: body.status === 'COMPLETED' && !task.completedAt 
          ? new Date() 
          : body.status !== 'COMPLETED' 
          ? null 
          : undefined,
        completedById: body.status === 'COMPLETED' && !task.completedAt 
          ? employeeId 
          : body.status !== 'COMPLETED' 
          ? null 
          : undefined
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        completedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Aufgabe' },
      { status: 500 }
    )
  }
}

// DELETE /api/employee/tasks/[id] - Aufgabe löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.id
    const taskId = params.id

    // Prüfen ob Aufgabe existiert
    const task = await prisma.employeeTask.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json({ error: 'Aufgabe nicht gefunden' }, { status: 404 })
    }

    // Nur Ersteller darf löschen
    if (task.createdById !== employeeId) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    await prisma.employeeTask.delete({
      where: { id: taskId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Aufgabe' },
      { status: 500 }
    )
  }
}
