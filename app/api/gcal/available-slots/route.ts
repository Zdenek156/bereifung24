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
    
    console.log('Getting available slots:', { workshopId, employeeId, date, duration })
    
    if (!workshopId || !date) {
      console.error('Missing required parameters:', { workshopId, date })
      return NextResponse.json(
        { error: 'Workshop ID und Datum erforderlich' },
        { status: 400 }
      )
    }
    
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      select: {
        id: true,
        calendarMode: true,
        openingHours: true,
        googleCalendarId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
        employees: {
          include: {
            employeeVacations: {
              where: {
                startDate: { lte: new Date(date + 'T23:59:59') },
                endDate: { gte: new Date(date + 'T00:00:00') }
              }
            }
          }
        },
        workshopVacations: {
          where: {
            startDate: { lte: new Date(date + 'T23:59:59') },
            endDate: { gte: new Date(date + 'T00:00:00') }
          }
        }
      }
    })
    
    if (!workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }
    
    // Check if workshop is on vacation
    if (workshop.workshopVacations && workshop.workshopVacations.length > 0) {
      return NextResponse.json({ 
        availableSlots: [],
        message: 'Werkstatt ist im Urlaub'
      })
    }
    
    let calendarData: {
      calendarId: string | null
      accessToken: string | null
      refreshToken: string | null
      tokenExpiry: Date | null
    } | null = null
    
    let workingHours: any = null
    let useEmployeeCalendars = false
    
    // Determine which calendar to use
    // Priority: 1. Workshop calendar (if connected), 2. Employee calendars (if available)
    
    const workshopHasCalendar = !!(
      workshop.googleCalendarId && 
      workshop.googleAccessToken && 
      workshop.googleRefreshToken
    )
    
    console.log('Calendar check:', {
      calendarMode: workshop.calendarMode,
      workshopHasCalendar,
      workshopCalendarId: workshop.googleCalendarId,
      employeeCount: workshop.employees.length
    })
    
    // INTELLIGENT FALLBACK: Try workshop calendar first if connected, otherwise use employees
    if (workshopHasCalendar) {
      // Use workshop calendar
      console.log('✓ Using workshop calendar (connected)')
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
    } else {
      // Fallback to employee calendars if workshop calendar is not connected
      useEmployeeCalendars = true
      console.log('⚠ Workshop calendar not connected, falling back to employee calendars...', {
        employeesTotal: workshop.employees.length
      })
    }
    
    if (useEmployeeCalendars) {
      // Use combined employee calendars - find slots where ANY employee is available
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const dateObj = new Date(date)
      
      // Filter employees who have calendar connected and are not on vacation
      const availableEmployees = workshop.employees.filter(emp => {
        // Must have calendar connected
        const hasCalendar = !!(emp.googleRefreshToken && emp.googleCalendarId)
        console.log(`Employee ${emp.name} calendar check:`, {
          hasRefreshToken: !!emp.googleRefreshToken,
          hasCalendarId: !!emp.googleCalendarId,
          hasCalendar
        })
        if (!hasCalendar) return false
        
        // Must not be on vacation
        if (emp.employeeVacations && emp.employeeVacations.length > 0) return false
        
        // Must be working on this day
        if (emp.workingHours) {
          try {
            const hours = JSON.parse(emp.workingHours)
            const dayHours = hours[dayOfWeek]
            if (!dayHours || !dayHours.working) return false
          } catch (e) {
            return false
          }
        }
        
        return true
      })
      
      console.log('Available employees with calendar:', availableEmployees.length)
      
      if (availableEmployees.length === 0) {
        return NextResponse.json(
          { 
            error: 'Kalender nicht verbunden',
            message: 'Bitte verbinden Sie einen Google Calendar in den Einstellungen (Werkstatt oder Mitarbeiter).',
            availableSlots: []
          },
          { status: 400 }
        )
      }
      
      // Get DB bookings for this workshop on this date
      const timeMin = new Date(date + 'T00:00:00')
      const timeMax = new Date(date + 'T23:59:59')
      
      const dbBookings = await prisma.booking.findMany({
        where: {
          workshopId: workshopId,
          appointmentDate: {
            gte: timeMin,
            lte: timeMax
          },
          status: {
            in: ['CONFIRMED', 'COMPLETED']
          }
        },
        select: {
          appointmentDate: true,
          estimatedDuration: true
        }
      })
      
      // Convert DB bookings to busy slots
      const dbBusySlots = dbBookings.map(booking => ({
        start: booking.appointmentDate.toISOString(),
        end: new Date(booking.appointmentDate.getTime() + booking.estimatedDuration * 60000).toISOString()
      }))
      
      // Collect all available slots from all employees
      const allSlotsMap = new Map<string, boolean>() // time -> isAvailable
      
      for (const employee of availableEmployees) {
        try {
          let accessToken = employee.googleAccessToken
          
          // Check if token needs refresh
          if (employee.googleTokenExpiry && new Date() > employee.googleTokenExpiry) {
            const newTokens = await refreshAccessToken(employee.googleRefreshToken!)
            accessToken = newTokens.access_token || accessToken
            
            // Update token in database
            const expiryDate = newTokens.expiry_date 
              ? new Date(newTokens.expiry_date)
              : new Date(Date.now() + 3600 * 1000)
            
            await prisma.employee.update({
              where: { id: employee.id },
              data: {
                googleAccessToken: accessToken,
                googleTokenExpiry: expiryDate
              }
            })
          }
          
          // Get employee working hours
          const hours = JSON.parse(employee.workingHours!)
          const employeeWorkingHours = hours[dayOfWeek]
          
          if (!employeeWorkingHours || !employeeWorkingHours.working) continue
          
          // Get busy slots from Google Calendar
          const timeMin = new Date(dateObj)
          timeMin.setHours(0, 0, 0, 0)
          
          const timeMax = new Date(dateObj)
          timeMax.setHours(23, 59, 59, 999)
          
          const busySlots = await getBusySlots(
            accessToken!,
            employee.googleRefreshToken!,
            employee.googleCalendarId!,
            timeMin.toISOString(),
            timeMax.toISOString()
          )
          
          // Filter and convert busy slots
          const validBusySlots = busySlots
            .filter(slot => slot.start && slot.end)
            .map(slot => ({
              start: slot.start as string,
              end: slot.end as string
            }))
          
          // Combine calendar busy slots with DB bookings
          const allEmployeeBusySlots = [...validBusySlots, ...dbBusySlots]
          console.log(`👤 Employee ${employee.name} (${employee.id}):`)
          console.log(`   📅 Calendar busy slots: ${validBusySlots.length}`)
          validBusySlots.forEach(slot => console.log(`      - ${slot.start} to ${slot.end}`))
          console.log(`   💾 DB busy slots: ${dbBusySlots.length}`)
          dbBusySlots.forEach(slot => console.log(`      - ${slot.start} to ${slot.end}`))
          console.log(`   ⏰ Working hours: ${JSON.stringify(employeeWorkingHours)}`)
          console.log(`   📆 Date being checked: ${dateObj.toISOString()}`)
          
          // Generate available slots for this employee
          const employeeSlots = generateAvailableSlots(
            dateObj,
            employeeWorkingHours,
            allEmployeeBusySlots,
            duration
          )
          console.log(`   ✅ Generated ${employeeSlots.length} available slots: ${employeeSlots.join(', ')}`)
          
          // Mark these slots as available
          employeeSlots.forEach(slot => {
            allSlotsMap.set(slot, true)
          })
        } catch (error) {
          console.error(`Error processing employee ${employee.id}:`, error)
          // Continue with other employees
        }
      }
      
      // Convert map to sorted array
      const availableSlots = Array.from(allSlotsMap.keys()).sort()
      
      // Add debug info for timezone issue
      const debugInfo = {
        dateRequested: date,
        dateObject: dateObj.toISOString(),
        employeeCount: availableEmployees.length,
        firstEmployeeBusySlots: availableEmployees.length > 0 ? await (async () => {
          const emp = availableEmployees[0]
          const cal = emp.googleCalendarId
          if (!cal) return []
          
          const busySlots = await getBusySlots(
            cal,
            emp.googleAccessToken!,
            emp.googleRefreshToken!,
            emp.googleTokenExpiry,
            workshop.id,
            date,
            date
          )
          
          return busySlots.map(s => ({ start: s.start, end: s.end }))
        })() : []
      }
      
      return NextResponse.json({ availableSlots, debug: debugInfo })
    }
    
    // This should only be reached if workshop calendar mode is selected but not connected
    if (!calendarData || !calendarData.calendarId || !calendarData.accessToken || !calendarData.refreshToken) {
      console.error('Workshop calendar not connected:', {
        hasCalendarData: !!calendarData,
        hasCalendarId: !!calendarData?.calendarId,
        hasAccessToken: !!calendarData?.accessToken,
        hasRefreshToken: !!calendarData?.refreshToken,
        workshopId,
        calendarMode: workshop.calendarMode,
        useEmployeeCalendars
      })
      
      return NextResponse.json(
        { 
          error: 'Kalender nicht verbunden', 
          message: 'Bitte verbinden Sie den Google Calendar in den Einstellungen.',
          details: {
            calendarMode: workshop.calendarMode,
            hasCalendar: !!calendarData?.calendarId,
            suggestion: 'Werkstatt-Kalender nicht verbunden. Wechseln Sie zu Mitarbeiter-Kalendern oder verbinden Sie den Werkstatt-Kalender.'
          }
        },
        { status: 400 }
      )
    }
    
    if (!workingHours || !workingHours.working || workingHours.closed) {
      const dayName = new Date(date).toLocaleDateString('de-DE', { weekday: 'long' })
      return NextResponse.json({ 
        availableSlots: [],
        message: `Die Werkstatt ist am ${dayName} geschlossen`
      })
    }
    
    // Check if token needs refresh or is about to expire (within 5 minutes)
    let accessToken = calendarData.accessToken
    const now = new Date()
    const expiryThreshold = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes from now
    
    if (!calendarData.tokenExpiry || calendarData.tokenExpiry < expiryThreshold) {
      console.log('Token expired or about to expire, refreshing...', {
        tokenExpiry: calendarData.tokenExpiry,
        now: now,
        workshopId
      })
      
      try {
        const newTokens = await refreshAccessToken(calendarData.refreshToken)
        accessToken = newTokens.access_token || accessToken
        
        // Update token in database
        const expiryDate = newTokens.expiry_date 
          ? new Date(newTokens.expiry_date)
          : new Date(Date.now() + 3600 * 1000)
        
        console.log('Token refreshed, new expiry:', expiryDate)
        
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
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError)
        return NextResponse.json(
          { 
            error: 'Kalender-Token abgelaufen', 
            message: 'Bitte verbinden Sie den Google Calendar erneut in den Einstellungen.',
            details: refreshError instanceof Error ? refreshError.message : String(refreshError)
          },
          { status: 401 }
        )
      }
    }
    
    // Get busy slots from Google Calendar
    const dateObj = new Date(date)
    const timeMin = new Date(dateObj)
    timeMin.setHours(0, 0, 0, 0)
    
    const timeMax = new Date(dateObj)
    timeMax.setHours(23, 59, 59, 999)
    
    console.log('Fetching busy slots for:', { calendarId: calendarData.calendarId, date, timeMin, timeMax })
    
    const busySlots = await getBusySlots(
      accessToken,
      calendarData.refreshToken,
      calendarData.calendarId,
      timeMin.toISOString(),
      timeMax.toISOString()
    )
    
    // Filter and convert busy slots to required format
    const validBusySlots = busySlots
      .filter(slot => slot.start && slot.end)
      .map(slot => ({
        start: slot.start as string,
        end: slot.end as string
      }))
    
    // ALSO get busy slots from database bookings (for bookings not yet synced to calendar)
    const dbBookings = await prisma.booking.findMany({
      where: {
        workshopId: workshopId,
        appointmentDate: {
          gte: timeMin,
          lte: timeMax
        },
        status: {
          in: ['CONFIRMED', 'COMPLETED'] // Don't block cancelled/no-show slots
        }
      },
      select: {
        appointmentDate: true,
        appointmentTime: true,
        estimatedDuration: true
      }
    })
    
    // Convert DB bookings to busy slot format
    const dbBusySlots = dbBookings.map(booking => {
      const start = new Date(booking.appointmentDate)
      const end = new Date(start.getTime() + booking.estimatedDuration * 60000)
      return {
        start: start.toISOString(),
        end: end.toISOString()
      }
    })
    
    // Combine calendar busy slots with DB bookings
    const allBusySlots = [...validBusySlots, ...dbBusySlots]
    
    console.log('📊 WORKSHOP CALENDAR - Busy slots:', {
      fromCalendar: validBusySlots.length,
      fromDatabase: dbBusySlots.length,
      total: allBusySlots.length
    })
    console.log('📅 All busy slots details:', JSON.stringify(allBusySlots, null, 2))
    
    // Generate available slots
    const availableSlots = generateAvailableSlots(
      dateObj,
      workingHours,
      allBusySlots,
      duration
    )
    
    return NextResponse.json({ availableSlots })
  } catch (error) {
    console.error('Error getting available slots:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Fehler beim Laden der verfügbaren Zeiten', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
