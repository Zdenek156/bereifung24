import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/workshop/employees/[id] - Delete an employee
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        workshop: true,
      },
    })

    if (!user || !user.workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Verify employee belongs to this workshop
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
    })

    if (!employee || employee.workshopId !== user.workshop.id) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.employee.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Employee delete error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Mitarbeiters' },
      { status: 500 }
    )
  }
}
