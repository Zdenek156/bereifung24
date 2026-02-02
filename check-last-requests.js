const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRequests() {
  try {
    const requests = await prisma.tireRequest.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        serviceType: true,
        createdAt: true,
        status: true,
        customerId: true
      }
    })
    
    console.log('📋 Letzte 5 Anfragen:')
    console.log(JSON.stringify(requests, null, 2))
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRequests()
