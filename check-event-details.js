const { PrismaClient } = require('@prisma/client')
const { google } = require('googleapis')

const prisma = new PrismaClient()

async function checkEventDetails() {
  try {
    // Get the offer details
    const offer = await prisma.offer.findUnique({
      where: { id: 'cmj9t29540008kc09mclu1uhi' },
      include: {
        tireOptions: true,
        tireRequest: {
          include: {
            customer: { include: { user: true } },
            vehicle: true
          }
        }
      }
    })
    
    console.log('Offer Details:')
    console.log('  Price:', offer.price, '€')
    console.log('  Selected Tire Option IDs:', offer.selectedTireOptionIds)
    console.log('\nTire Options:')
    offer.tireOptions.forEach(opt => {
      console.log(`  - ${opt.brand} (${opt.id})`)
      console.log(`    Price per tire: ${opt.pricePerTire}€`)
      console.log(`    Montage price: ${opt.montagePrice}€`)
    })
    
    // Get employee and event
    const employee = await prisma.employee.findFirst({
      where: { googleCalendarId: 'zdenek156@gmail.com' }
    })
    
    const booking = await prisma.booking.findFirst({
      where: { tireRequestId: 'cmj9t0q6k0006kc09hyugwvbm' }
    })
    
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: employee.googleAccessToken })
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    
    const event = await calendar.events.get({
      calendarId: employee.googleCalendarId,
      eventId: booking.googleEventId
    })
    
    console.log('\n=== CURRENT CALENDAR EVENT ===')
    console.log('Summary:', event.data.summary)
    console.log('\nDescription:')
    console.log(event.data.description)
    console.log('\n==============================')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEventDetails()
