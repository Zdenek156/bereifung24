import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBusySlots, generateAvailableSlots, refreshAccessToken } from '@/lib/google-calendar'

// Get available time slots for a workshop or employee on a specific date
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const workshopId = searchParams.get('workshopId')
    const employeeId = searchParams.get('employeeId')
    const date = searchParams.get('date') // YYYY-MM-DD
    const duration = parseInt(searchParams.get('duration') || '60') // minutes
    
    if (!workshopId || !date) {
      return NextResponse.json(
        { error: 'Workshop ID und Datum erforderlich' },
        { status: 400 }
      )
    }
    
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        employees: true
      }
    })
    
    if (!workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }
    
    let calendarData: {
      calendarId: string | null
      accessToken: string | null
      refreshToken: string | null
      tokenExpiry: Date | null
    } | null = null
    
    let workingHours: any = null
    
    // Determine which calendar to use
    if (workshop.calendarMode === 'workshop') {
      // Use workshop calendar
      calendarData = {
        calendarId: workshop.googleCalendarId,
        accessToken: workshop.googleAccessToken,
        refreshToken: workshop.googleRefreshToken,
        tokenExpiry: workshop.googleTokenExpiry
      }
      
      // Get workshop opening hours for the specific day
      if (workshop.openingHours) {
        const hours = JSON.parse(workshop.openingHours)
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        workingHours = hours[dayOfWeek]
      }
    } else if (workshop.calendarMode === 'employees' && employeeId) {
      // Use employee calendar
      const employee = workshop.employees.find(e => e.id === employeeId)
      
      if (!employee) {
        return NextResponse.json(
          { error: 'Mitarbeiter nicht gefunden' },
          { status: 404 }
        )
      }
      
      calendarData = {
        calendarId: employee.googleCalendarId,
        accessToken: employee.googleAccessToken,
        refreshToken: employee.googleRefreshToken,
        tokenExpiry: employee.googleTokenExpiry
      }
      
      // Get employee working hours for the specific day
      if (employee.workingHours) {
        const hours = JSON.parse(employee.workingHours)
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' })
        workingHours = hours[dayOfWeek]
      }
    }
    
    if (!calendarData || !calendarData.calendarId || !calendarData.accessToken || !calendarData.refreshToken) {
      return NextResponse.json(
        { error: 'Kalender nicht verbunden' },
        { status: 400 }
      )
    }
    
    if (!workingHours || !workingHours.working) {
      return NextResponse.json({ availableSlots: [] })
    }
    
    // Check if token needs refresh
    let accessToken = calendarData.accessToken
    if (calendarData.tokenExpiry && new Date() > calendarData.tokenExpiry) {
      const newTokens = await refreshAccessToken(calendarData.refreshToken)
      accessToken = newTokens.access_token || accessToken
      
      // Update token in database
      const expiryDate = newTokens.expiry_date 
        ? new Date(newTokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000)
      
      if (workshop.calendarMode === 'workshop') {
        await prisma.workshop.update({
          where: { id: workshopId },
          data: {
            googleAccessToken: accessToken,
            googleTokenExpiry: expiryDate
          }
        })
      } else if (employeeId) {
        await prisma.employee.update({
          where: { id: employeeId },
          data: {
            googleAccessToken: accessToken,
            googleTokenExpiry: expiryDate
          }
        })
      }
    }
    
    // Get busy slots from Google Calendar
    const dateObj = new Date(date)
    const timeMin = new Date(dateObj)
    timeMin.setHours(0, 0, 0, 0)
    
    const timeMax = new Date(dateObj)
    timeMax.setHours(23, 59, 59, 999)
    
    const busySlots = await getBusySlots(
      accessToken,
      calendarData.refreshToken,
      calendarData.calendarId,
      timeMin.toISOString(),
      timeMax.toISOString()
    )
    
    // Generate available slots
    const availableSlots = generateAvailableSlots(
      dateObj,
      workingHours,
      busySlots,
      duration
    )
    
    return NextResponse.json({ availableSlots })
  } catch (error) {
    console.error('Error getting available slots:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der verfügbaren Zeiten' },
      { status: 500 }
    )
  }
}
