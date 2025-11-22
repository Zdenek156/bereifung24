import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/workshop/employees - Get all employees for a workshop
export async function GET() {
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
        workshop: {
          include: {
            employees: true,
          },
        },
      },
    })

    if (!user || !user.workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      employees: user.workshop.employees,
    })
  } catch (error) {
    console.error('Employees fetch error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Mitarbeiter' },
      { status: 500 }
    )
  }
}

// POST /api/workshop/employees - Create a new employee
export async function POST(request: Request) {
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

    const body = await request.json()
    const { name, email, workingHours } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name und E-Mail sind erforderlich' },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.create({
      data: {
        workshopId: user.workshop.id,
        name,
        email,
        workingHours: workingHours ? JSON.stringify(workingHours) : null,
      },
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Employee create error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Mitarbeiters' },
      { status: 500 }
    )
  }
}
