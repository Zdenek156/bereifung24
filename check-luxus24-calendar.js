const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const workshop = await prisma.workshop.findFirst({
    where: {
      companyName: 'Luxus24'
    },
    select: {
      id: true,
      companyName: true,
      calendarMode: true,
      googleCalendarId: true,
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
      employees: {
        select: {
          id: true,
          name: true,
          googleCalendarId: true,
          googleAccessToken: true,
          googleRefreshToken: true,
          googleTokenExpiry: true
        }
      }
    }
  })
  
  if (!workshop) {
    console.log('❌ Luxus24 not found!')
    return
  }
  
  console.log('=== LUXUS24 CALENDAR STATUS ===\n')
  console.log('Company:', workshop.companyName)
  console.log('ID:', workshop.id)
  console.log('Calendar Mode:', workshop.calendarMode || 'NOT SET')
  console.log('\n--- Workshop Calendar ---')
  console.log('Calendar ID:', workshop.googleCalendarId || 'NOT SET')
  console.log('Access Token:', workshop.googleAccessToken ? `SET (${workshop.googleAccessToken.substring(0, 20)}...)` : 'NOT SET')
  console.log('Refresh Token:', workshop.googleRefreshToken ? `SET (${workshop.googleRefreshToken.substring(0, 20)}...)` : 'NOT SET')
  console.log('Token Expiry:', workshop.googleTokenExpiry || 'NOT SET')
  
  const workshopHasCalendar = !!(
    workshop.googleCalendarId && 
    workshop.googleAccessToken && 
    workshop.googleRefreshToken
  )
  console.log('\n✓ Workshop has calendar:', workshopHasCalendar)
  
  console.log('\n--- Employees ---')
  console.log('Total employees:', workshop.employees.length)
  
  workshop.employees.forEach((emp, i) => {
    console.log(`\nEmployee ${i + 1}: ${emp.name}`)
    console.log('  Calendar ID:', emp.googleCalendarId || 'NOT SET')
    console.log('  Has Access Token:', !!emp.googleAccessToken)
    console.log('  Has Refresh Token:', !!emp.googleRefreshToken)
    console.log('  Token Expiry:', emp.googleTokenExpiry || 'NOT SET')
  })
  
  console.log('\n================================')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
