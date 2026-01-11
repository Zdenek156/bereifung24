const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testAvailableEmployeeLogic() {
  try {
    console.log('🧪 Testing employee availability filter logic...\n')
    
    const date = '2026-01-15' // Mittwoch
    const workshopId = 'cmi9c1qzn000110hd0838ppwx'
    
    console.log(`Testing for date: ${date}`)
    
    const dateObj = new Date(date)
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    console.log(`Day of week: ${dayOfWeek}\n`)
    
    // Get workshop with employees
    const workshop = await prisma.workshop.findUnique({
      where: { id: 'cmi9c1qzn000110hd0838ppwx' },
      select: {
        employees: {
          include: {
            employeeVacations: {
              where: {
                startDate: { lte: new Date('2026-01-15T23:59:59') },
                endDate: { gte: new Date('2026-01-15T00:00:00') }
              }
            }
          }
        }
      }
    })
    
    if (!workshop) {
      console.log('Workshop not found')
      return
    }
    
    console.log(`Found ${workshop.employees.length} employee(s)\n`)
    
    for (const emp of workshop.employees) {
      console.log(`👤 Employee: ${emp.name}`)
      
      // Check 1: Has calendar?
      const hasCalendar = !!(emp.googleRefreshToken && emp.googleCalendarId)
      console.log(`   ✓ Has Calendar: ${hasCalendar}`)
      if (!hasCalendar) {
        console.log(`   ❌ FILTERED OUT: No calendar`)
        continue
      }
      
      // Check 2: On vacation?
      const hasVacation = emp.employeeVacations && emp.employeeVacations.length > 0
      console.log(`   ✓ On Vacation: ${hasVacation}`)
      if (hasVacation) {
        console.log('      → FILTERED OUT: On vacation')
        continue
      }
      
      // Check 3: Working hours
      if (emp.workingHours) {
        try {
          const hours = JSON.parse(emp.workingHours)
          const dayOfWeek = 'wednesday' // 15. Januar 2026
          const dayHours = hours[dayOfWeek]
          
          console.log(`      Working hours for ${dayOfWeek}:`, dayHours)
          
          if (!dayHours) {
            console.log(`      ❌ No hours configured for ${dayOfWeek}`)
          } else if (!dayHours.working) {
            console.log(`      ❌ Not working on ${dayOfWeek}`)
          } else {
            console.log(`      ✅ Working on ${dayOfWeek}: ${dayHours.from} - ${dayHours.to}`)
          }
        } catch (e) {
          console.log(`      ❌ Error parsing working hours: ${e.message}`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAvailableEmployeeLogic()
