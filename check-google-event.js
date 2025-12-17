const { PrismaClient } = require('@prisma/client')
const { google } = require('googleapis')

const prisma = new PrismaClient()

async function checkGoogleCalendarEvent() {
  try {
    // Get employee with calendar access
    const employee = await prisma.employee.findFirst({
      where: {
        googleCalendarId: 'zdenek156@gmail.com'
      }
    })
    
    if (!employee) {
      console.log('Employee not found')
      return
    }
    
    console.log('Employee:', employee.name)
    console.log('Calendar ID:', employee.googleCalendarId)
    console.log('Access Token:', employee.googleAccessToken ? 'EXISTS' : 'NULL')
    
    // Get latest booking
    const booking = await prisma.booking.findFirst({
      where: {
        tireRequestId: 'cmj9t0q6k0006kc09hyugwvbm'
      }
    })
    
    console.log('\nBooking:')
    console.log('  ID:', booking.id)
    console.log('  Google Event ID:', booking.googleEventId)
    console.log('  Appointment Date:', booking.appointmentDate)
    console.log('  Appointment Time:', booking.appointmentTime)
    
    if (!booking.googleEventId) {
      console.log('\n❌ No Google Event ID in database')
      return
    }
    
    // Try to get the event from Google Calendar
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({
      access_token: employee.googleAccessToken
    })
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    
    try {
      const event = await calendar.events.get({
        calendarId: employee.googleCalendarId,
        eventId: booking.googleEventId
      })
      
      console.log('\n✅ Event found in Google Calendar:')
      console.log('  Summary:', event.data.summary)
      console.log('  Description:', event.data.description?.substring(0, 100) + '...')
      console.log('  Start:', event.data.start.dateTime)
      console.log('  End:', event.data.end.dateTime)
      console.log('  Status:', event.data.status)
      console.log('  HTML Link:', event.data.htmlLink)
    } catch (eventError) {
      console.log('\n❌ Event NOT found in Google Calendar')
      console.log('Error:', eventError.message)
      
      // Try to list recent events
      console.log('\n📅 Recent events in calendar:')
      const events = await calendar.events.list({
        calendarId: employee.googleCalendarId,
        timeMin: new Date('2025-12-24').toISOString(),
        timeMax: new Date('2025-12-26').toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
      })
      
      if (events.data.items.length === 0) {
        console.log('  No events found')
      } else {
        events.data.items.forEach(event => {
          console.log(`  - ${event.summary} (${event.start.dateTime}) - ID: ${event.id}`)
        })
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkGoogleCalendarEvent()
