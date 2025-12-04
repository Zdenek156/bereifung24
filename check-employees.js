const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkEmployees() {
  try {
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        workshopId: true,
        googleRefreshToken: true,
        googleCalendarId: true,
        googleTokenExpiry: true,
        workingHours: true
      }
    })
    
    console.log('\n=== ALL EMPLOYEES IN DATABASE ===')
    console.log('Total:', employees.length)
    
    employees.forEach((e, i) => {
      console.log('\n' + (i+1) + '. ' + e.name + ' (' + e.email + ')')
      console.log('   Workshop ID:', e.workshopId)
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

checkEmployees()
