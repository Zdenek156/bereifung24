import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBusySlots } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const workshopId = searchParams.get('workshopId')
    const employeeId = searchParams.get('employeeId')
    const date = searchParams.get('date') || '2025-12-05'
    
    if (!workshopId) {
      return NextResponse.json({ error: 'workshopId required' }, { status: 400 })
    }

    const result: any = {
      date,
      workshopId,
      employeeId,
      calendarBusySlots: [],
      databaseBookings: [],
      calendarInfo: {}
    }

    // Get workshop info
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        employees: true
      }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    // Check if workshop has calendar
    const workshopHasCalendar = !!(
      workshop.googleCalendarId && 
      workshop.googleAccessToken && 
      workshop.googleRefreshToken
    )

    result.calendarInfo = {
      workshopHasCalendar,
      workshopCalendarId: workshop.googleCalendarId || null,
      employeesWithCalendar: workshop.employees
        .filter(e => e.googleCalendarId && e.googleAccessToken && e.googleRefreshToken)
        .map(e => ({ id: e.id, calendarId: e.googleCalendarId }))
    }

    // Set time range for the date
    const dateObj = new Date(date)
    const timeMin = new Date(dateObj)
    timeMin.setHours(0, 0, 0, 0)
    const timeMax = new Date(dateObj)
    timeMax.setHours(23, 59, 59, 999)

    // Get busy slots from calendar
    if (employeeId) {
      // Check specific employee calendar
      const employee = workshop.employees.find(e => e.id === employeeId)
      if (employee && employee.googleCalendarId && employee.googleAccessToken && employee.googleRefreshToken) {
        const busySlots = await getBusySlots(
          employee.googleAccessToken,
          employee.googleRefreshToken,
          employee.googleCalendarId,
          timeMin.toISOString(),
          timeMax.toISOString()
        )
        result.calendarBusySlots = busySlots
        result.source = 'employee'
        result.calendarId = employee.googleCalendarId
      }
    } else if (workshopHasCalendar) {
      // Check workshop calendar
      const busySlots = await getBusySlots(
        workshop.googleAccessToken!,
        workshop.googleRefreshToken!,
        workshop.googleCalendarId!,
        timeMin.toISOString(),
        timeMax.toISOString()
      )
      result.calendarBusySlots = busySlots
      result.source = 'workshop'
      result.calendarId = workshop.googleCalendarId
    } else if (workshop.employees.length > 0) {
      // Check first employee calendar
      const employee = workshop.employees.find(e => 
        e.googleCalendarId && e.googleAccessToken && e.googleRefreshToken
      )
      if (employee) {
        const busySlots = await getBusySlots(
          employee.googleAccessToken!,
          employee.googleRefreshToken!,
          employee.googleCalendarId!,
          timeMin.toISOString(),
          timeMax.toISOString()
        )
        result.calendarBusySlots = busySlots
        result.source = 'employee (first available)'
        result.calendarId = employee.googleCalendarId
        result.employeeId = employee.id
      }
    }

    // Get database bookings
    const dbBookings = await prisma.booking.findMany({
      where: {
        workshopId,
        appointmentDate: {
          gte: timeMin,
          lte: timeMax
        },
        status: {
          in: ['CONFIRMED', 'COMPLETED']
        }
      },
      select: {
        id: true,
        appointmentDate: true,
        appointmentTime: true,
        estimatedDuration: true,
        status: true,
        googleEventId: true
      }
    })

    result.databaseBookings = dbBookings.map(b => ({
      id: b.id,
      appointmentDate: b.appointmentDate.toISOString(),
      appointmentTime: b.appointmentTime,
      duration: b.estimatedDuration,
      status: b.status,
      hasCalendarEvent: !!b.googleEventId,
      googleEventId: b.googleEventId
    }))

    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Error in check-busy-slots:', error)
    return NextResponse.json(
      { 
        error: 'Internal error', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
