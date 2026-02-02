import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Create a new reminder
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const { title, dueDate, notes } = body

    if (!title || !dueDate) {
      return NextResponse.json(
        { error: 'Titel und Datum sind erforderlich' },
        { status: 400 }
      )
    }

    // Get workshop ID from session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { workshopId: true }
    })

    if (!user?.workshopId) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 400 }
      )
    }

    const reminder = await prisma.customerReminder.create({
      data: {
        customerId: params.id,
        workshopId: user.workshopId,
        title,
        dueDate: new Date(dueDate),
        notes: notes || null,
        completed: false,
        createdBy: session.user.id
      }
    })

    return NextResponse.json({ success: true, reminder })
  } catch (error) {
    console.error('Error creating reminder:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Erinnerung' },
      { status: 500 }
    )
  }
}

// GET - Fetch all reminders for a customer
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const reminders = await prisma.customerReminder.findMany({
      where: {
        customerId: params.id
      },
      orderBy: {
        dueDate: 'asc'
      },
      include: {
        createdByUser: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, reminders })
  } catch (error) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Erinnerungen' },
      { status: 500 }
    )
  }
}
