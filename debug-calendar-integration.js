const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugCalendarIntegration() {
  console.log('\n=== CALENDAR INTEGRATION DEBUG ===\n')
  
  // Check workshops with opening hours
  const workshopsWithHours = await prisma.workshop.findMany({
    where: { openingHours: { not: null } },
    select: {
      id: true,
      companyName: true,
      openingHours: true,
      calendarMode: true,
      googleCalendarId: true,
      googleAccessToken: true,
      employees: {
        where: { googleCalendarId: { not: null } },
        select: {
          name: true,
          email: true,
          googleCalendarId: true,
          googleAccessToken: true
        }
      }
    },
    take: 5
  })
  
  console.log(`\n📅 Workshops with Opening Hours: ${workshopsWithHours.length}\n`)
  
  workshopsWithHours.forEach(w => {
    console.log(`\n🏢 ${w.companyName} (${w.id})`)
    console.log(`   Opening Hours: ${w.openingHours ? 'YES' : 'NO'}`)
    if (w.openingHours) {
      try {
        const hours = JSON.parse(w.openingHours)
        console.log(`   Parsed:`, hours)
      } catch (e) {
        console.log(`   ERROR parsing: ${e.message}`)
      }
    }
    console.log(`   Calendar Mode: ${w.calendarMode || 'NOT SET'}`)
    console.log(`   Workshop Google Calendar: ${w.googleCalendarId ? 'YES' : 'NO'}`)
    console.log(`   Workshop Has Token: ${w.googleAccessToken ? 'YES' : 'NO'}`)
    console.log(`   Employees with Calendar: ${w.employees.length}`)
    w.employees.forEach(emp => {
      console.log(`     - ${emp.name || emp.email}: ID=${emp.googleCalendarId ? 'YES' : 'NO'}, Token=${emp.googleAccessToken ? 'YES' : 'NO'}`)
    })
  })
  
  // Check all workshops without opening hours
  const totalWorkshops = await prisma.workshop.count()
  const withoutHours = await prisma.workshop.count({
    where: { openingHours: null }
  })
  
  console.log(`\n\n📊 Summary:`)
  console.log(`   Total Workshops: ${totalWorkshops}`)
  console.log(`   With Opening Hours: ${totalWorkshops - withoutHours}`)
  console.log(`   Without Opening Hours: ${withoutHours}`)
  
  // Check specific workshop by ID (if you want to test a specific one)
  const testWorkshopId = 'cml3g7rxd000ckeyn9ypqgg65' // Luxus24 from earlier
  const testWorkshop = await prisma.workshop.findUnique({
    where: { id: testWorkshopId },
    select: {
      companyName: true,
      openingHours: true,
      calendarMode: true,
      googleCalendarId: true,
      googleAccessToken: true,
      employees: {
        select: {
          name: true,
          email: true,
          googleCalendarId: true,
          googleAccessToken: true
        }
      }
    }
  })
  
  if (testWorkshop) {
    console.log(`\n\n🔍 Test Workshop: ${testWorkshop.companyName}`)
    console.log(`   Opening Hours:`, testWorkshop.openingHours)
    console.log(`   Calendar Mode:`, testWorkshop.calendarMode)
    console.log(`   Google Calendar ID:`, testWorkshop.googleCalendarId)
    console.log(`   Has Access Token:`, testWorkshop.googleAccessToken ? 'YES' : 'NO')
    console.log(`   Employees:`, testWorkshop.employees.length)
  }
  
  await prisma.$disconnect()
}

debugCalendarIntegration().catch(console.error)
