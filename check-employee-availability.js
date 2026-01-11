const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAvailableEmployees() {
  try {
    console.log('🔍 Checking available employees for booking...\n')
    
    // Get all workshops
    const workshops = await prisma.workshop.findMany({
      select: {
        id: true,
        companyName: true,
        calendarMode: true,
        googleCalendarId: true,
        googleRefreshToken: true,
        employees: {
          include: {
            employeeVacations: true
          }
        }
      }
    })
    
    for (const workshop of workshops) {
      console.log(`\n📍 Workshop: ${workshop.companyName}`)
      console.log(`   ID: ${workshop.id}`)
      console.log(`   Calendar Mode: ${workshop.calendarMode}`)
      console.log(`   Workshop Calendar Connected: ${!!workshop.googleCalendarId && !!workshop.googleRefreshToken}`)
      console.log(`   Employees: ${workshop.employees.length}\n`)
      
      // Check each employee
      for (const emp of workshop.employees) {
        console.log(`   👤 Employee: ${emp.name}`)
        console.log(`      Has googleRefreshToken: ${!!emp.googleRefreshToken}`)
        console.log(`      Has googleCalendarId: ${!!emp.googleCalendarId}`)
        console.log(`      Working Hours: ${emp.workingHours ? 'Set' : 'Not set'}`)
        
        if (emp.workingHours) {
          try {
            const hours = JSON.parse(emp.workingHours)
            console.log(`      Working Days: ${Object.keys(hours).filter(day => hours[day]?.working).join(', ')}`)
          } catch (e) {
            console.log(`      Working Hours: Invalid JSON`)
          }
        }
        
        // Check what the API logic would do
        const hasCalendar = !!(emp.googleRefreshToken && emp.googleCalendarId)
        const hasVacation = emp.employeeVacations && emp.employeeVacations.length > 0
        
        console.log(`      ✓ Has Calendar: ${hasCalendar}`)
        console.log(`      ✓ On Vacation: ${hasVacation}`)
        
        // Check working hours for today (Saturday)
        if (emp.workingHours) {
          try {
            const hours = JSON.parse(emp.workingHours)
            const saturday = hours.saturday
            console.log(`      ✓ Saturday Hours: ${saturday ? JSON.stringify(saturday) : 'Not set'}`)
            
            if (saturday) {
              console.log(`      ✓ Working Saturday: ${saturday.working}`)
            }
          } catch (e) {
            console.log(`      ✗ Error parsing working hours`)
          }
        }
        
        console.log('')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAvailableEmployees()
