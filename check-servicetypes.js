const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const requests = await prisma.tireRequest.findMany({
    select: {
      id: true,
      serviceType: true,
      createdAt: true,
      additionalNotes: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  
  console.log(JSON.stringify(requests, null, 2))
  await prisma.$disconnect()
}

main()
