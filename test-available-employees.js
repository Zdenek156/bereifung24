const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testAvailableEmployees() {
  const workshopId = 'cmi9c1qzn000110hd0838ppwx'
  const date = '2025-12-16' // Das Datum das der Kunde wählt
  
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    select: {
      id: true,
      calendarMode: true,
      googleCalendarId: true,
      googleAccessToken: true,
      googleRefreshToken: true,
      employees: {
        include: {
          employeeVacations: {
            where: {
              startDate: { lte: new Date(date + 'T23:59:59') },
              endDate: { gte: new Date(date + 'T00:00:00') }
            }
          }
        }
      }
    }
  })
  
  console.log('Workshop:', {
    id: workshop.id,
    calendarMode: workshop.calendarMode,
    hasWorkshopCalendar: !!(workshop.googleCalendarId && workshop.googleRefreshToken),
    workshopCalendarId: workshop.googleCalendarId,
    employeeCount: workshop.employees.length
  })
  
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  console.log('\nDate:', date, '=> Day of week:', dayOfWeek)
  
  console.log('\n--- Employee Filtering ---')
  const availableEmployees = workshop.employees.filter(emp => {
    console.log(`\nEmployee: ${emp.name} (${emp.email})`)
    
    // Must have calendar connected
    const hasCalendar = !!(emp.googleRefreshToken && emp.googleCalendarId)
    console.log(`  ✓ Has calendar: ${hasCalendar}`, {
      hasRefreshToken: !!emp.googleRefreshToken,
      hasCalendarId: !!emp.googleCalendarId
    })
    if (!hasCalendar) {
      console.log(`  ✗ FILTERED OUT: No calendar`)
      return false
    }
    
    // Must not be on vacation
    if (emp.employeeVacations && emp.employeeVacations.length > 0) {
      console.log(`  ✗ FILTERED OUT: On vacation`, emp.employeeVacations)
      return false
    }
    console.log(`  ✓ Not on vacation`)
    
    // Must be working on this day
    if (emp.workingHours) {
      try {
        const hours = JSON.parse(emp.workingHours)
        const dayHours = hours[dayOfWeek]
        console.log(`  Working hours for ${dayOfWeek}:`, dayHours)
        if (!dayHours || !dayHours.working) {
          console.log(`  ✗ FILTERED OUT: Not working on ${dayOfWeek}`)
          return false
        }
        console.log(`  ✓ Working on ${dayOfWeek}`)
      } catch (e) {
        console.log(`  ✗ FILTERED OUT: workingHours parsing error:`, e.message)
        return false
      }
    } else {
      console.log(`  ⚠ No workingHours set (passes by default)`)
    }
    
    console.log(`  ✅ EMPLOYEE AVAILABLE`)
    return true
  })
  
  console.log('\n=============================')
  console.log('Available employees:', availableEmployees.length)
  console.log('Names:', availableEmployees.map(e => e.name))
  
  await prisma.$disconnect()
}

testAvailableEmployees().catch(console.error)
