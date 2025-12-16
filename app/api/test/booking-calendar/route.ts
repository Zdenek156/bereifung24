import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const workshopId = 'cmi9c1qzn000110hd0838ppwx'
    const appointmentDate = new Date('2025-12-22T13:40:00.000Z')
    
    console.log('=== BOOKING TEST START ===')
    console.log('Workshop ID:', workshopId)
    console.log('Appointment Date:', appointmentDate)
    
    const appointmentDateObj = appointmentDate
    const requestedTime = appointmentDateObj.toTimeString().substring(0, 5)
    const dateOnly = appointmentDateObj.toISOString().split('T')[0]
    
    console.log('Requested time:', requestedTime)
    console.log('Date only:', dateOnly)
    
    // Get workshop with calendar info
    const workshopForCheck = await prisma.workshop.findUnique({
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
          select: {
            id: true,
            name: true,
            workingHours: true,
            googleCalendarId: true,
            googleAccessToken: true,
            googleRefreshToken: true,
            googleTokenExpiry: true,
            employeeVacations: {
              where: {
                startDate: { lte: appointmentDateObj },
                endDate: { gte: appointmentDateObj }
              }
            }
          }
        }
      }
    })
    
    if (!workshopForCheck) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }
    
    console.log('Workshop loaded:', {
      id: workshopForCheck.id,
      calendarMode: workshopForCheck.calendarMode,
      hasWorkshopCalendar: !!(workshopForCheck.googleCalendarId && workshopForCheck.googleRefreshToken),
      employeeCount: workshopForCheck.employees.length
    })
    
    const workshopHasCalendarForCheck = !!(
      workshopForCheck.googleCalendarId && 
      workshopForCheck.googleRefreshToken
    )
    
    console.log('Workshop has calendar:', workshopHasCalendarForCheck)
    console.log('Will use employee calendars:', workshopForCheck.calendarMode === 'EMPLOYEE' || !workshopHasCalendarForCheck)
    
    if (workshopForCheck.calendarMode === 'EMPLOYEE' || !workshopHasCalendarForCheck) {
      const dayOfWeek = appointmentDateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      console.log('Day of week:', dayOfWeek)
      
      const availableEmployees = workshopForCheck.employees.filter(emp => {
        console.log(`Checking employee ${emp.name}:`, {
          hasCalendarId: !!emp.googleCalendarId,
          hasRefreshToken: !!emp.googleRefreshToken,
          hasAccessToken: !!emp.googleAccessToken,
          onVacation: emp.employeeVacations && emp.employeeVacations.length > 0
        })
        
        if (!emp.googleCalendarId || !emp.googleRefreshToken) {
          console.log(`  -> Filtered out: No calendar`)
          return false
        }
        
        if (emp.employeeVacations && emp.employeeVacations.length > 0) {
          console.log(`  -> Filtered out: On vacation`)
          return false
        }
        
        if (emp.workingHours) {
          try {
            const hours = JSON.parse(emp.workingHours)
            const dayHours = hours[dayOfWeek]
            console.log(`  -> Working hours for ${dayOfWeek}:`, dayHours)
            if (!dayHours || !dayHours.working) {
              console.log(`  -> Filtered out: Not working on ${dayOfWeek}`)
              return false
            }
          } catch (e) {
            console.log(`  -> Filtered out: Error parsing working hours`)
            return false
          }
        }
        
        console.log(`  -> AVAILABLE`)
        return true
      })
      
      console.log('Available employees:', availableEmployees.length)
      availableEmployees.forEach(emp => {
        console.log(`- ${emp.name}:`, {
          id: emp.id,
          hasAccessToken: !!emp.googleAccessToken,
          tokenExpiry: emp.googleTokenExpiry
        })
      })
      
      if (availableEmployees.length === 0) {
        return NextResponse.json({
          error: 'No employees available',
          message: 'Keine Mitarbeiter mit Kalender verfügbar'
        }, { status: 400 })
      }
      
      // Test token refresh logic
      for (const employee of availableEmployees) {
        console.log(`\nTesting token for ${employee.name}:`)
        let accessToken = employee.googleAccessToken
        console.log('  Initial access token:', accessToken ? accessToken.substring(0, 20) + '...' : 'NULL')
        console.log('  Token expiry:', employee.googleTokenExpiry)
        console.log('  Needs refresh:', !accessToken || (employee.googleTokenExpiry && new Date() > employee.googleTokenExpiry))
        
        if (!accessToken || (employee.googleTokenExpiry && new Date() > employee.googleTokenExpiry)) {
          console.log('  -> Would refresh token here')
        }
        
        if (!accessToken) {
          console.log('  -> ERROR: No access token available!')
        } else {
          console.log('  -> OK: Access token available')
        }
      }
      
      return NextResponse.json({
        success: true,
        workshopHasCalendar: workshopHasCalendarForCheck,
        calendarMode: workshopForCheck.calendarMode,
        willUseEmployeeCalendars: true,
        availableEmployeesCount: availableEmployees.length,
        employees: availableEmployees.map(emp => ({
          name: emp.name,
          hasAccessToken: !!emp.googleAccessToken,
          hasRefreshToken: !!emp.googleRefreshToken,
          hasCalendarId: !!emp.googleCalendarId
        }))
      })
    } else {
      return NextResponse.json({
        success: true,
        workshopHasCalendar: workshopHasCalendarForCheck,
        calendarMode: workshopForCheck.calendarMode,
        willUseEmployeeCalendars: false,
        message: 'Would use workshop calendar'
      })
    }
    
  } catch (error) {
    console.error('=== TEST ERROR ===')
    console.error('Error:', error)
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
