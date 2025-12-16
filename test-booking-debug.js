const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testBooking() {
  const workshopId = 'cmi9c1qzn000110hd0838ppwx'
  const appointmentDate = new Date('2025-12-22T13:40:00.000Z')
  
  const workshopForCheck = await prisma.workshop.findUnique({
    where: { id: workshopId },
    select: {
      id: true,
      calendarMode: true,
      openingHours: true,
      googleCalendarId: true,
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
      employees: {
        select: {
          id: true,
          name: true,
          workingHours: true,
          googleCalendarId: true,
          googleAccessToken: true,
          googleRefreshToken: true,
          googleTokenExpiry: true,
        }
      }
    }
  })
  
  console.log('Workshop Calendar Mode:', workshopForCheck.calendarMode)
  console.log('Workshop has calendar:', {
    googleCalendarId: !!workshopForCheck.googleCalendarId,
    googleAccessToken: !!workshopForCheck.googleAccessToken,
    googleRefreshToken: !!workshopForCheck.googleRefreshToken,
  })
  
  console.log('\nEmployees:', workshopForCheck.employees.length)
  workshopForCheck.employees.forEach(emp => {
    console.log(`- ${emp.name}:`, {
      googleCalendarId: !!emp.googleCalendarId,
      googleAccessToken: !!emp.googleAccessToken,
      googleRefreshToken: !!emp.googleRefreshToken,
      tokenExpiry: emp.googleTokenExpiry
    })
  })
  
  const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  console.log('\nDay of week:', dayOfWeek)
  
  // Simulate the filter
  const availableEmployees = workshopForCheck.employees.filter(emp => {
    if (!emp.googleCalendarId || !emp.googleRefreshToken) return false
    
    if (emp.workingHours) {
      try {
        const hours = JSON.parse(emp.workingHours)
        const dayHours = hours[dayOfWeek]
        if (!dayHours || !dayHours.working) return false
      } catch (e) {
        return false
      }
    }
    return true
  })
  
  console.log('\nAvailable employees:', availableEmployees.length)
  availableEmployees.forEach(emp => {
    console.log(`- ${emp.name}:`,  {
      id: emp.id,
      hasAccessToken: !!emp.googleAccessToken,
      accessToken: emp.googleAccessToken ? emp.googleAccessToken.substring(0, 20) + '...' : null
    })
  })
  
  await prisma.$disconnect()
}

testBooking().catch(console.error)
