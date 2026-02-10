import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'

/**
 * POST /api/customer/direct-booking/slots
 * Get available time slots for a workshop service
 * 
 * Body:
 * {
 *   workshopId: string,
 *   serviceType: string,
 *   date: string (YYYY-MM-DD),
 *   duration: number (minutes)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { workshopId, serviceType, date, duration = 60 } = body

    if (!workshopId || !serviceType || !date) {
      return NextResponse.json(
        { error: 'Fehlende Parameter' },
        { status: 400 }
      )
    }

    // Get workshop with opening hours and employees
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        workshopVacations: {
          where: {
            startDate: { lte: new Date(date) },
            endDate: { gte: new Date(date) }
          }
        },
        employees: {
          where: {
            OR: [
              { googleCalendarId: { not: null } },
              { googleRefreshToken: { not: null } }
            ]
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

    // Check if date is vacation day
    if (workshop.workshopVacations.length > 0) {
      return NextResponse.json({
        success: true,
        slots: [],
        message: 'Werkstatt hat an diesem Tag Urlaub'
      })
    }

    // Parse opening hours (handle double-escaped JSON)
    let openingHours = null
    console.log('Workshop opening hours raw:', workshop.openingHours)
    try {
      if (workshop.openingHours) {
        // Try to parse - might be double-escaped
        let parsed = JSON.parse(workshop.openingHours)
        // If it's a string after first parse, parse again (double-escaped)
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed)
        }
        openingHours = parsed
      }
      console.log('Parsed opening hours:', openingHours)
    } catch (error) {
      console.error('Failed to parse opening hours:', error)
      return NextResponse.json({
        success: true,
        slots: [],
        message: 'Werkstatt hat keine gültigen Öffnungszeiten konfiguriert'
      })
    }

    // Get day of week (monday, tuesday, etc.)
    const dateObj = new Date(date)
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
    if (!openingHours || !openingHours[dayOfWeek]) {
      console.log('No opening hours for', dayOfWeek, '- Available days:', openingHours ? Object.keys(openingHours) : 'none')
      return NextResponse.json({
        success: true,
        slots: [],
        message: `Werkstatt ist an diesem Tag (${dayOfWeek}) geschlossen`
      })
    }

    const dayHours = openingHours[dayOfWeek]
    console.log('Day hours for', dayOfWeek, ':', dayHours)
    
    // Check if day is closed
    if (!dayHours || (typeof dayHours === 'object' && dayHours.closed === true)) {
      console.log('Workshop closed on', dayOfWeek)
      return NextResponse.json({
        success: true,
        slots: [],
        message: 'Werkstatt ist an diesem Tag geschlossen'
      })
    }

    // Parse opening hours - support both formats:
    // 1. String format: "08:00-18:00"
    // 2. Object format: {from: "08:00", to: "18:00", closed: false}
    let openTime: string
    let closeTime: string
    
    if (typeof dayHours === 'string' && dayHours.includes('-')) {
      // Old format: "08:00-18:00"
      [openTime, closeTime] = dayHours.split('-')
    } else if (typeof dayHours === 'object' && dayHours.from && dayHours.to) {
      // New format: {from: "08:00", to: "18:00"}
      openTime = dayHours.from
      closeTime = dayHours.to
    } else {
      console.error('Invalid opening hours format for', dayOfWeek, ':', dayHours)
      return NextResponse.json({
        success: true,
        slots: [],
        message: 'Werkstatt ist an diesem Tag geschlossen'
      })
    }

    console.log('Open time:', openTime, 'Close time:', closeTime)
    
    // Generate time slots based on opening hours
    const slots = generateTimeSlots(openTime, closeTime, duration)

    // Get existing bookings for this date
    // WORKAROUND: @db.Date fields in Prisma don't support direct equality checks
    // We need to fetch all bookings for this workshop and filter by date in code
    const dateOnly = date // Already in YYYY-MM-DD format from frontend
    
    // FIRST: Delete expired reservations (older than 10 minutes) before checking slots
    const now = new Date()
    await prisma.directBooking.deleteMany({
      where: {
        status: 'RESERVED',
        reservedUntil: {
          lt: now // Less than now = expired
        }
      }
    })
    
    // Fetch ALL bookings for this workshop (we'll filter by date AND status in code)
    // NOTE: Can't use status: { in: [...] } because Prisma doesn't support it for String fields
    const allBookings = await prisma.directBooking.findMany({
      where: {
        workshopId
      },
      select: {
        id: true,
        date: true,
        time: true,
        status: true,
        reservedUntil: true
      }
    })
    
    // Filter bookings for the requested date AND active status
    // For RESERVED status, also check if not expired
    const existingBookings = allBookings.filter(booking => {
      // Format date in local timezone for comparison
      const bookingDateStr = `${booking.date.getFullYear()}-${String(booking.date.getMonth() + 1).padStart(2, '0')}-${String(booking.date.getDate()).padStart(2, '0')}`
      
      if (bookingDateStr !== dateOnly) {
        return false // Different date
      }
      
      if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
        return true // Always include confirmed/completed bookings
      }
      
      if (booking.status === 'RESERVED') {
        // Only include if not expired
        return booking.reservedUntil && booking.reservedUntil > now
      }
      
      return false
    })
    
    console.log('Total workshop bookings:', allBookings.length, '| Bookings on', dateOnly + ':', existingBookings.length)

    // Fetch Google Calendar events to block slots
    const googleCalendarBookedSlots: string[] = []
    
    // Check workshop-level Google Calendar
    if (workshop.googleCalendarId && workshop.googleRefreshToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.NEXTAUTH_URL + '/api/gcal/callback'
        )

        oauth2Client.setCredentials({
          refresh_token: workshop.googleRefreshToken,
          access_token: workshop.googleAccessToken,
        })

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
        
        // Get events for the selected date
        const startOfDay = new Date(date + 'T00:00:00')
        const endOfDay = new Date(date + 'T23:59:59')
        
        const response = await calendar.events.list({
          calendarId: workshop.googleCalendarId,
          timeMin: startOfDay.toISOString(),
          timeMax: endOfDay.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        })

        const events = response.data.items || []
        console.log('Workshop Google Calendar events:', events.length)
        
        // Extract start times from events and mark slots as booked
        events.forEach(event => {
          if (event.start?.dateTime) {
            // Convert UTC to Europe/Berlin timezone
            const eventStart = new Date(event.start.dateTime)
            const eventEnd = new Date(event.end?.dateTime || eventStart)
            
            // Convert to German timezone (UTC+1 or UTC+2 depending on DST)
            const berlinStart = new Date(eventStart.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))
            const berlinEnd = new Date(eventEnd.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))
            
            // Block all slots that overlap with this event
            const startTime = `${berlinStart.getHours().toString().padStart(2, '0')}:${berlinStart.getMinutes().toString().padStart(2, '0')}`
            const endTime = `${berlinEnd.getHours().toString().padStart(2, '0')}:${berlinEnd.getMinutes().toString().padStart(2, '0')}`
            
            // Add start time slot
            if (!googleCalendarBookedSlots.includes(startTime)) {
              googleCalendarBookedSlots.push(startTime)
            }
            
            // Also block slots during the event duration (every 30 minutes)
            let currentMinutes = berlinStart.getHours() * 60 + berlinStart.getMinutes()
            const endMinutes = berlinEnd.getHours() * 60 + berlinEnd.getMinutes()
            
            while (currentMinutes < endMinutes) {
              const slotHour = Math.floor(currentMinutes / 60)
              const slotMin = currentMinutes % 60
              const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMin.toString().padStart(2, '0')}`
              
              if (!googleCalendarBookedSlots.includes(slotTime)) {
                googleCalendarBookedSlots.push(slotTime)
              }
              
              currentMinutes += 30 // Increment by 30 minutes (slot interval)
            }
          }
        })
      } catch (calError) {
        console.error('Error fetching workshop Google Calendar events:', calError)
        // Continue without Google Calendar events if error occurs
      }
    }
    
    // Check employee-level Google Calendars
    for (const employee of workshop.employees) {
      if (employee.googleCalendarId && employee.googleRefreshToken) {
        try {
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.NEXTAUTH_URL + '/api/gcal/callback'
          )

          oauth2Client.setCredentials({
            refresh_token: employee.googleRefreshToken,
            access_token: employee.googleAccessToken,
          })

          const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
          
          // Get events for the selected date
          const startOfDay = new Date(date + 'T00:00:00')
          const endOfDay = new Date(date + 'T23:59:59')
          
          const response = await calendar.events.list({
            calendarId: employee.googleCalendarId,
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
          })

          const events = response.data.items || []
          console.log(`Employee ${employee.name} Google Calendar events:`, events.length)
          
          // Extract start times from events and mark slots as booked
          events.forEach(event => {
            if (event.start?.dateTime) {
              // Convert UTC to Europe/Berlin timezone
              const eventStart = new Date(event.start.dateTime)
              const eventEnd = new Date(event.end?.dateTime || eventStart)
              
              // Convert to German timezone (UTC+1 or UTC+2 depending on DST)
              const berlinStart = new Date(eventStart.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))
              const berlinEnd = new Date(eventEnd.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))
              
              // Block all slots that overlap with this event
              const startTime = `${berlinStart.getHours().toString().padStart(2, '0')}:${berlinStart.getMinutes().toString().padStart(2, '0')}`
              const endTime = `${berlinEnd.getHours().toString().padStart(2, '0')}:${berlinEnd.getMinutes().toString().padStart(2, '0')}`
              
              // Add start time slot
              if (!googleCalendarBookedSlots.includes(startTime)) {
                googleCalendarBookedSlots.push(startTime)
              }
              
              // Block ALL time slots that would overlap with this event
              // We need to check which of our service slots (generated based on service duration)
              // would overlap with this calendar event
              // For this, we generate all possible time slots and mark them as busy
              let currentMinutes = berlinStart.getHours() * 60 + berlinStart.getMinutes()
              const endMinutes = berlinEnd.getHours() * 60 + berlinEnd.getMinutes()
              
              // Block in intervals matching the service duration to match the generated slots
              while (currentMinutes < endMinutes) {
                const slotHour = Math.floor(currentMinutes / 60)
                const slotMin = currentMinutes % 60
                const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMin.toString().padStart(2, '0')}`
                
                if (!googleCalendarBookedSlots.includes(slotTime)) {
                  googleCalendarBookedSlots.push(slotTime)
                }
                
                currentMinutes += duration // Increment by service duration to match slot generation
              }
            }
          })
        } catch (calError) {
          console.error(`Error fetching employee ${employee.name} Google Calendar events:`, calError)
          // Continue without this employee's Google Calendar events if error occurs
        }
      }
    }
    
    console.log('Google Calendar booked slots:', googleCalendarBookedSlots)

    // Filter out booked slots (both from database AND Google Calendar)
    const availableSlots = slots.filter(slot => {
      const slotTime = slot.time
      
      // Check database bookings
      const isBookedInDB = existingBookings.some(booking => {
        const bookingTime = booking.time
        return bookingTime === slotTime
      })
      
      // Check Google Calendar bookings
      const isBookedInGoogleCalendar = googleCalendarBookedSlots.includes(slotTime)
      
      return !isBookedInDB && !isBookedInGoogleCalendar
    })

    return NextResponse.json({
      success: true,
      slots: availableSlots,
      workshop: {
        id: workshop.id,
        name: workshop.name,
        openingHours: openingHours[dayOfWeek]
      }
    })

  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der verfügbaren Termine' },
      { status: 500 }
    )
  }
}

// Helper function to generate time slots
function generateTimeSlots(openTime: string, closeTime: string, duration: number): Array<{time: string, available: boolean}> {
  const slots: Array<{time: string, available: boolean}> = []
  const [openHour, openMin] = openTime.split(':').map(Number)
  const [closeHour, closeMin] = closeTime.split(':').map(Number)
  
  let currentTime = openHour * 60 + openMin // minutes since midnight
  const endTime = closeHour * 60 + closeMin
  
  while (currentTime + duration <= endTime) {
    const hours = Math.floor(currentTime / 60)
    const minutes = currentTime % 60
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    
    slots.push({
      time: timeString,
      available: true
    })
    
    currentTime += duration
  }
  
  return slots
}
