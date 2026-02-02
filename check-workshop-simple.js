const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

prisma.workshop.findUnique({
  where: { email: 'bikeanzeigen@gmail.com' }
}).then(w => {
  console.log('isVerified:', w.isVerified)
  console.log('emailNotifyRequests:', w.emailNotifyRequests)
  console.log('coordinates:', w.coordinates)
}).finally(() => prisma.$disconnect())
