const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCalendar() {
  try {
    const workshops = await prisma.workshop.findMany({
      where: {
        googleCalendarId: { not: null }
      },
      select: {
        id: true,
        companyName: true,
        googleCalendarId: true,
        googleTokenExpiry: true,
        calendarMode: true,
        openingHours: true
      }
    })
    
    console.log('Workshops with calendar:', workshops.length)
    workshops.forEach(w => {
      console.log('\n---')
      console.log('ID:', w.id)
      console.log('Name:', w.companyName)
      console.log('Calendar ID:', w.googleCalendarId)
      console.log('Token Expiry:', w.googleTokenExpiry)
      console.log('Calendar Mode:', w.calendarMode)
      console.log('Opening Hours:', w.openingHours ? 'Set' : 'Not set')
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCalendar()
