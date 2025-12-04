const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCalendar() {
  try {
    const workshop = await prisma.workshop.findFirst({
      include: {
        employees: {
          select: {
            id: true,
            name: true,
            email: true,
            googleRefreshToken: true,
            googleCalendarId: true,
            googleTokenExpiry: true,
            workingHours: true
          }
        }
      }
    })
    
    if (!workshop) {
      console.log('No workshop found')
      return
    }

    console.log('\n=== WORKSHOP ===')
    console.log('ID:', workshop.id)
    console.log('Name:', workshop.companyName)
    console.log('Calendar Mode:', workshop.calendarMode)
    console.log('Has Workshop Token:', !!workshop.googleRefreshToken)
    console.log('Workshop Calendar ID:', workshop.googleCalendarId || 'none')
    console.log('Token Expiry:', workshop.googleTokenExpiry)
    console.log('Opening Hours:', workshop.openingHours)

    console.log('\n=== EMPLOYEES (' + workshop.employees.length + ') ===')
    workshop.employees.forEach((e, i) => {
      console.log('\n' + (i+1) + '. ' + e.name + ' (' + e.email + ')')
      console.log('   Has Token:', !!e.googleRefreshToken)
      console.log('   Calendar ID:', e.googleCalendarId || 'none')
      console.log('   Token Expiry:', e.googleTokenExpiry)
      console.log('   Working Hours:', e.workingHours)
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCalendar()
