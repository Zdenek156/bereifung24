const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const emp = await prisma.employee.findFirst({
    where: { email: 'zdenek156@gmail.com' },
    include: { workshop: true }
  })
  
  console.log('Employee Calendar Status:')
  console.log({
    name: emp?.name,
    googleCalendarId: emp?.googleCalendarId,
    hasRefreshToken: !!emp?.googleRefreshToken,
    tokenExpiry: emp?.googleTokenExpiry,
    workshopId: emp?.workshopId,
    workshopName: emp?.workshop?.companyName
  })
  
  await prisma.$disconnect()
}

main()
