import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Urlaubskonto & Anträge abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.b24EmployeeId

    // Aktuelles Jahr
    const currentYear = new Date().getFullYear()

    // Urlaubskonto
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_year: {
          employeeId,
          year: currentYear
        }
      }
    })

    // Alle Urlaubsanträge
    const requests = await prisma.leaveRequest.findMany({
      where: { employeeId },
      include: {
        approvedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        substitute: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      balance: balance || {
        totalDays: 30,
        usedDays: 0,
        pendingDays: 0,
        remainingDays: 30,
        carryOverDays: 0
      },
      requests
    })
  } catch (error) {
    console.error('Error fetching leave data:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Daten' },
      { status: 500 }
    )
  }
}

// POST - Neuen Urlaubsantrag erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.b24EmployeeId
    const body = await request.json()
    const { type, startDate, endDate, reason, substituteId } = body

    // Validierung
    if (!type || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Pflichtfelder fehlen' },
        { status: 400 }
      )
    }

    // Berechne Arbeitstage (vereinfacht)
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    // Erstelle Antrag
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days: diffDays,
        reason,
        substituteId,
        status: 'pending'
      }
    })

    // Update LeaveBalance (pending)
    const currentYear = new Date().getFullYear()
    await prisma.leaveBalance.upsert({
      where: {
        employeeId_year: {
          employeeId,
          year: currentYear
        }
      },
      update: {
        pendingDays: { increment: diffDays }
      },
      create: {
        employeeId,
        year: currentYear,
        totalDays: 30,
        usedDays: 0,
        pendingDays: diffDays,
        remainingDays: 30 - diffDays
      }
    })

    // TODO: Benachrichtigung an HR/Vorgesetzten senden

    return NextResponse.json({
      success: true,
      request: leaveRequest
    })
  } catch (error) {
    console.error('Error creating leave request:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Antrags' },
      { status: 500 }
    )
  }
}
