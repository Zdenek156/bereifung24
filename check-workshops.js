const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWorkshops() {
  try {
    const workshops = await prisma.workshop.findMany({
      select: {
        id: true,
        companyName: true,
        googleCalendarId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
        calendarMode: true,
        openingHours: true
      }
    })
    
    console.log('Total workshops:', workshops.length)
    workshops.forEach(w => {
      console.log('\n---')
      console.log('ID:', w.id)
      console.log('Name:', w.companyName)
      console.log('Calendar ID:', w.googleCalendarId || 'NULL')
      console.log('Has Access Token:', !!w.googleAccessToken)
      console.log('Has Refresh Token:', !!w.googleRefreshToken)
      console.log('Token Expiry:', w.googleTokenExpiry || 'NULL')
      console.log('Calendar Mode:', w.calendarMode || 'NULL')
      console.log('Opening Hours:', w.openingHours ? 'Set' : 'NULL')
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWorkshops()
