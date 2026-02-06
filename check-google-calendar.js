const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkGoogleCalendar() {
  const workshops = await prisma.workshop.findMany({
    where: {
      OR: [
        { googleCalendarId: { not: null } },
        { employees: { some: { googleCalendarId: { not: null } } } }
      ]
    },
    select: {
      id: true,
      companyName: true,
      calendarMode: true,
      googleCalendarId: true,
      googleAccessToken: true,
      employees: {
        select: {
          id: true,
          name: true,
          email: true,
          googleCalendarId: true,
          googleAccessToken: true
        }
      }
    },
    take: 5
  })
  
  console.log('\n=== Workshops with Google Calendar ===')
  console.log(`Found ${workshops.length} workshops with Google Calendar\n`)
  
  workshops.forEach(w => {
    console.log(`\n${w.companyName}:`)
    console.log(`  Calendar Mode: ${w.calendarMode || 'NOT SET'}`)
    console.log(`  Workshop Calendar ID: ${w.googleCalendarId ? 'YES' : 'NO'}`)
    console.log(`  Workshop Access Token: ${w.googleAccessToken ? 'YES' : 'NO'}`)
    console.log(`  Employees with Calendar: ${w.employees.filter(e => e.googleCalendarId).length}`)
    
    w.employees.filter(e => e.googleCalendarId).forEach(emp => {
      console.log(`    - ${emp.name || emp.email}: ${emp.googleCalendarId}`)
    })
  })
  
  await prisma.$disconnect()
}

checkGoogleCalendar().catch(console.error)
