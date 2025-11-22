import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Urlaubszeiten eines Mitarbeiters abrufen
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop nicht gefunden' }, { status: 404 })
    }

    // Sicherstellen, dass der Mitarbeiter zur Werkstatt gehört
    const employee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        workshopId: workshop.id
      },
      include: {
        employeeVacations: {
          orderBy: { startDate: 'asc' }
        }
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({ vacations: employee.employeeVacations })
  } catch (error) {
    console.error('Error fetching employee vacations:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Urlaubszeiten' }, { status: 500 })
  }
}

// POST - Neue Urlaubszeit für Mitarbeiter hinzufügen
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop nicht gefunden' }, { status: 404 })
    }

    // Sicherstellen, dass der Mitarbeiter zur Werkstatt gehört
    const employee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        workshopId: workshop.id
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 })
    }

    const { startDate, endDate, reason } = await req.json()

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start- und Enddatum sind erforderlich' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return NextResponse.json({ error: 'Enddatum muss nach Startdatum liegen' }, { status: 400 })
    }

    const vacation = await prisma.employeeVacation.create({
      data: {
        employeeId: employee.id,
        startDate: start,
        endDate: end,
        reason: reason || null
      }
    })

    return NextResponse.json({ vacation })
  } catch (error) {
    console.error('Error creating employee vacation:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Urlaubszeit' }, { status: 500 })
  }
}

// DELETE - Mitarbeiter-Urlaubszeit löschen
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const vacationId = searchParams.get('vacationId')

    if (!vacationId) {
      return NextResponse.json({ error: 'Vacation ID erforderlich' }, { status: 400 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop nicht gefunden' }, { status: 404 })
    }

    // Sicherstellen, dass die Urlaubszeit zum Mitarbeiter und zur Werkstatt gehört
    const vacation = await prisma.employeeVacation.findFirst({
      where: {
        id: vacationId,
        employee: {
          id: params.id,
          workshopId: workshop.id
        }
      }
    })

    if (!vacation) {
      return NextResponse.json({ error: 'Urlaubszeit nicht gefunden' }, { status: 404 })
    }

    await prisma.employeeVacation.delete({
      where: { id: vacationId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting employee vacation:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Urlaubszeit' }, { status: 500 })
  }
}
