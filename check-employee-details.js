const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkEmployee() {
  const emp = await prisma.employee.findFirst({
    where: { email: 'zdenek156@gmail.com' }
  })
  
  if (!emp) {
    console.log('Employee not found!')
    return
  }
  
  console.log('Employee Details:')
  console.log({
    name: emp.name,
    email: emp.email,
    workshopId: emp.workshopId,
    googleCalendarId: emp.googleCalendarId,
    hasAccessToken: !!emp.googleAccessToken,
    accessTokenLength: emp.googleAccessToken ? emp.googleAccessToken.length : 0,
    hasRefreshToken: !!emp.googleRefreshToken,
    refreshTokenLength: emp.googleRefreshToken ? emp.googleRefreshToken.length : 0,
    tokenExpiry: emp.googleTokenExpiry,
    workingHours: emp.workingHours,
  })
  
  await prisma.$disconnect()
}

checkEmployee().catch(console.error)
