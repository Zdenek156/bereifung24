import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Aktuelle Session & Übersicht
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.b24EmployeeId

    // Aktuelle aktive Session
    const activeSession = await prisma.workSession.findFirst({
      where: {
        employeeId,
        isActive: true
      },
      include: {
        breaks: {
          where: { endTime: null }
        }
      }
    })

    // Heutige Sessions
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaySessions = await prisma.workSession.findMany({
      where: {
        employeeId,
        startTime: { gte: today }
      },
      include: {
        breaks: true
      },
      orderBy: { startTime: 'asc' }
    })

    // Berechne Tagesstatistik
    const todayMinutes = todaySessions.reduce((sum, s) => {
      return sum + (s.workMinutes || 0)
    }, 0)

    return NextResponse.json({
      activeSession,
      todaySessions,
      todayHours: (todayMinutes / 60).toFixed(2)
    })
  } catch (error) {
    console.error('Error fetching time data:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Daten' },
      { status: 500 }
    )
  }
}

// POST - Aktion ausführen (start, stop, break-start, break-end)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.b24EmployeeId
    const body = await request.json()
    const { action, notes } = body

    switch (action) {
      case 'start': {
        // Starte neue Session
        const workSession = await prisma.workSession.create({
          data: {
            employeeId,
            startTime: new Date(),
            isActive: true,
            notes
          }
        })
        return NextResponse.json({ success: true, session: workSession })
      }

      case 'stop': {
        // Beende aktive Session
        const activeSession = await prisma.workSession.findFirst({
          where: { employeeId, isActive: true },
          include: { breaks: true }
        })

        if (!activeSession) {
          return NextResponse.json({ error: 'Keine aktive Session' }, { status: 400 })
        }

        const endTime = new Date()
        const totalMinutes = Math.floor((endTime.getTime() - activeSession.startTime.getTime()) / 60000)
        
        // Berechne Pausenzeit
        const breakMinutes = activeSession.breaks.reduce((sum, b) => {
          if (b.endTime) {
            return sum + Math.floor((b.endTime.getTime() - b.startTime.getTime()) / 60000)
          }
          return sum
        }, 0)

        const workMinutes = totalMinutes - breakMinutes

        const updated = await prisma.workSession.update({
          where: { id: activeSession.id },
          data: {
            endTime,
            totalMinutes,
            breakMinutes,
            workMinutes,
            isActive: false
          }
        })

        // Update Überstunden-Saldo
        await updateOvertimeBalance(employeeId)

        return NextResponse.json({ success: true, session: updated })
      }

      case 'break-start': {
        // Starte Pause
        const activeSession = await prisma.workSession.findFirst({
          where: { employeeId, isActive: true }
        })

        if (!activeSession) {
          return NextResponse.json({ error: 'Keine aktive Session' }, { status: 400 })
        }

        const breakRecord = await prisma.break.create({
          data: {
            sessionId: activeSession.id,
            startTime: new Date()
          }
        })

        return NextResponse.json({ success: true, break: breakRecord })
      }

      case 'break-end': {
        // Beende Pause
        const activeSession = await prisma.workSession.findFirst({
          where: { employeeId, isActive: true }
        })

        if (!activeSession) {
          return NextResponse.json({ error: 'Keine aktive Session' }, { status: 400 })
        }

        const activeBreak = await prisma.break.findFirst({
          where: {
            sessionId: activeSession.id,
            endTime: null
          }
        })

        if (!activeBreak) {
          return NextResponse.json({ error: 'Keine aktive Pause' }, { status: 400 })
        }

        const endTime = new Date()
        const minutes = Math.floor((endTime.getTime() - activeBreak.startTime.getTime()) / 60000)

        const updated = await prisma.break.update({
          where: { id: activeBreak.id },
          data: { endTime, minutes }
        })

        return NextResponse.json({ success: true, break: updated })
      }

      default:
        return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in time tracking action:', error)
    return NextResponse.json(
      { error: 'Fehler beim Ausführen der Aktion' },
      { status: 500 }
    )
  }
}

// Hilfsfunktion: Überstunden-Saldo aktualisieren
async function updateOvertimeBalance(employeeId: string) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // Alle Sessions des Monats
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)

  const sessions = await prisma.workSession.findMany({
    where: {
      employeeId,
      startTime: { gte: startOfMonth, lte: endOfMonth },
      isActive: false
    }
  })

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.workMinutes || 0), 0)
  const actualHours = totalMinutes / 60

  // Angenommen: 160h Soll pro Monat (40h/Woche * 4 Wochen)
  const targetHours = 160
  const overtimeHours = actualHours - targetHours

  // Vormonat holen für kumulierte Überstunden
  const previousMonth = month === 1 ? 12 : month - 1
  const previousYear = month === 1 ? year - 1 : year

  const previousBalance = await prisma.overtimeBalance.findUnique({
    where: {
      employeeId_year_month: {
        employeeId,
        year: previousYear,
        month: previousMonth
      }
    }
  })

  const cumulativeOvertime = (previousBalance?.cumulativeOvertime || 0) + overtimeHours

  await prisma.overtimeBalance.upsert({
    where: {
      employeeId_year_month: {
        employeeId,
        year,
        month
      }
    },
    update: {
      actualHours,
      overtimeHours,
      cumulativeOvertime
    },
    create: {
      employeeId,
      year,
      month,
      targetHours,
      actualHours,
      overtimeHours,
      cumulativeOvertime
    }
  })
}
