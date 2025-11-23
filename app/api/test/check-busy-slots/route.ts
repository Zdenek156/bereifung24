import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBusySlots } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    let workshopId = searchParams.get('workshopId')
    const employeeId = searchParams.get('employeeId')
    const date = searchParams.get('date') || '2025-12-05'
    
    // If no workshopId provided, get the first workshop
    if (!workshopId) {
      const firstWorkshop = await prisma.workshop.findFirst()
      if (!firstWorkshop) {
        return NextResponse.json({ error: 'No workshops found' }, { status: 404 })
      }
      workshopId = firstWorkshop.id
    }

    const result: any = {
      date,
      workshopId,
      employeeId,
      calendarBusySlots: [],
      databaseBookings: [],
      calendarInfo: {}
    }

    // Get workshop info with ALL employee fields
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        employees: {
          select: {
            id: true,
            googleCalendarId: true,
            googleAccessToken: true,
            googleRefreshToken: true,
            googleTokenExpiry: true,
            workingHours: true
          }
        }
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

    // Get busy slots from calendar - CHECK ALL SOURCES
    const allCalendarSlots: any[] = []
    
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
        allCalendarSlots.push({
          source: 'employee (requested)',
          employeeId: employee.id,
          calendarId: employee.googleCalendarId,
          busySlots
        })
      }
    } else {
      // Check workshop calendar if available
      if (workshopHasCalendar) {
        const busySlots = await getBusySlots(
          workshop.googleAccessToken!,
          workshop.googleRefreshToken!,
          workshop.googleCalendarId!,
          timeMin.toISOString(),
          timeMax.toISOString()
        )
        allCalendarSlots.push({
          source: 'workshop',
          calendarId: workshop.googleCalendarId,
          busySlots
        })
      }
      
      // Check ALL employee calendars
      for (const employee of workshop.employees) {
        if (employee.googleCalendarId && employee.googleAccessToken && employee.googleRefreshToken) {
          try {
            const busySlots = await getBusySlots(
              employee.googleAccessToken,
              employee.googleRefreshToken,
              employee.googleCalendarId,
              timeMin.toISOString(),
              timeMax.toISOString()
            )
            allCalendarSlots.push({
              source: 'employee',
              employeeId: employee.id,
              calendarId: employee.googleCalendarId,
              busySlots
            })
          } catch (error) {
            allCalendarSlots.push({
              source: 'employee',
              employeeId: employee.id,
              calendarId: employee.googleCalendarId,
              error: error instanceof Error ? error.message : String(error)
            })
          }
        }
      }
    }
    
    result.allCalendarSources = allCalendarSlots
    // Combine all busy slots for backward compatibility
    result.calendarBusySlots = allCalendarSlots.flatMap(source => source.busySlots || [])

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
