const { PrismaClient } = require('@prisma/client')
const { google } = require('googleapis')
const prisma = new PrismaClient()

async function testCalendarAccess() {
  try {
    console.log('🧪 Testing Google Calendar API access...\n')
    
    // Get employee with calendar
    const employee = await prisma.employee.findFirst({
      where: {
        googleCalendarId: { not: null }
      },
      select: {
        id: true,
        name: true,
        googleCalendarId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
        workshop: {
          select: {
            companyName: true
          }
        }
      }
    })
    
    if (!employee) {
      console.log('❌ No employee with Google Calendar found')
      return
    }
    
    console.log(`📍 Testing calendar for: ${employee.name}`)
    console.log(`   Workshop: ${employee.workshop.companyName}`)
    console.log(`   Calendar ID: ${employee.googleCalendarId}`)
    console.log(`   Token Expiry: ${employee.googleTokenExpiry}\n`)
    
    // Check if token is expired
    const now = new Date()
    const expiry = new Date(employee.googleTokenExpiry)
    const isExpired = expiry < now
    
    console.log(`   Token Status: ${isExpired ? '❌ EXPIRED' : '✅ Valid'}`)
    if (isExpired) {
      console.log(`   Expired ${Math.round((now - expiry) / 1000 / 60)} minutes ago`)
    }
    console.log('')
    
    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/gcal/callback`
    )
    
    oauth2Client.setCredentials({
      access_token: employee.googleAccessToken,
      refresh_token: employee.googleRefreshToken,
      expiry_date: expiry.getTime()
    })
    
    // Create calendar client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    
    console.log('🔄 Attempting to list calendar events...')
    
    try {
      // Try to list events (last 7 days to next 7 days)
      const response = await calendar.events.list({
        calendarId: employee.googleCalendarId,
        timeMin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
      })
      
      console.log(`✅ Calendar API access successful!`)
      console.log(`   Found ${response.data.items?.length || 0} events\n`)
      
      if (response.data.items && response.data.items.length > 0) {
        console.log('📅 Recent events:')
        response.data.items.forEach((event, index) => {
          const start = event.start?.dateTime || event.start?.date
          console.log(`   ${index + 1}. ${event.summary} (${start})`)
        })
      } else {
        console.log('   No events in this time range')
      }
      
      console.log('\n✅ Google Calendar integration is working correctly!')
      
    } catch (apiError) {
      console.error('❌ Calendar API Error:', apiError.message)
      
      if (apiError.code === 401) {
        console.log('\n⚠️  Token is invalid or expired')
        console.log('   Trying to refresh token...\n')
        
        try {
          const { credentials } = await oauth2Client.refreshAccessToken()
          console.log('✅ Token refreshed successfully!')
          console.log(`   New expiry: ${new Date(credentials.expiry_date)}\n`)
          
          // Update database with new token
          await prisma.employee.update({
            where: { id: employee.id },
            data: {
              googleAccessToken: credentials.access_token,
              googleRefreshToken: credentials.refresh_token || employee.googleRefreshToken,
              googleTokenExpiry: new Date(credentials.expiry_date)
            }
          })
          
          console.log('✅ Database updated with new token')
          console.log('   Please try your calendar query again!')
          
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError.message)
          console.log('\n⚠️  You need to reconnect the Google Calendar:')
          console.log('   1. Go to Dashboard → Settings → Employees')
          console.log('   2. Disconnect calendar')
          console.log('   3. Reconnect calendar')
        }
      } else if (apiError.code === 403) {
        console.log('\n⚠️  Permission denied')
        console.log('   Make sure the Google Calendar API is enabled in Google Cloud Console')
      } else if (apiError.code === 404) {
        console.log('\n⚠️  Calendar not found')
        console.log(`   Calendar ID: ${employee.googleCalendarId}`)
        console.log('   The calendar might have been deleted')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCalendarAccess()
