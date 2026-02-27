import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Urlaubszeiten der Werkstatt abrufen
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      include: {
        workshopVacations: {
          orderBy: { startDate: 'asc' }
        },
        employees: {
          select: {
            googleRefreshToken: true
          }
        }
      }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop nicht gefunden' }, { status: 404 })
    }

    // Check if workshop has calendar OR any employee has calendar
    const hasWorkshopCalendar = !!workshop.googleRefreshToken
    const hasEmployeeCalendar = workshop.employees.some(emp => !!emp.googleRefreshToken)
    const hasCalendar = hasWorkshopCalendar || hasEmployeeCalendar

    return NextResponse.json({ 
      vacations: workshop.workshopVacations,
      hasCalendar
    })
  } catch (error) {
    console.error('Error fetching vacations:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Urlaubszeiten' }, { status: 500 })
  }
}

// POST - Neue Urlaubszeit hinzufügen
export async function POST(req: NextRequest) {
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

    const { startDate, endDate, reason } = await req.json()

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start- und Enddatum sind erforderlich' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      return NextResponse.json({ error: 'Enddatum darf nicht vor Startdatum liegen' }, { status: 400 })
    }

    const vacation = await prisma.workshopVacation.create({
      data: {
        workshopId: workshop.id,
        startDate: start,
        endDate: end,
        reason: reason || null
      }
    })

    return NextResponse.json({ vacation })
  } catch (error) {
    console.error('Error creating vacation:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Urlaubszeit' }, { status: 500 })
  }
}

// DELETE - Urlaubszeit löschen
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const vacationId = searchParams.get('id')

    if (!vacationId) {
      return NextResponse.json({ error: 'Vacation ID erforderlich' }, { status: 400 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop nicht gefunden' }, { status: 404 })
    }

    // Sicherstellen, dass die Urlaubszeit zur Werkstatt gehört
    const vacation = await prisma.workshopVacation.findFirst({
      where: {
        id: vacationId,
        workshopId: workshop.id
      }
    })

    if (!vacation) {
      return NextResponse.json({ error: 'Urlaubszeit nicht gefunden' }, { status: 404 })
    }

    await prisma.workshopVacation.delete({
      where: { id: vacationId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vacation:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Urlaubszeit' }, { status: 500 })
  }
}
