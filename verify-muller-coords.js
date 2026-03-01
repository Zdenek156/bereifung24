const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const muller = await prisma.workshop.findFirst({
    where: { companyName: { contains: 'Müller' } }
  })
  
  if (muller) {
    console.log(JSON.stringify({
      id: muller.id,
      companyName: muller.companyName,
      status: muller.status,
      latitude: muller.latitude,
      longitude: muller.longitude
    }, null, 2))
  } else {
    console.log('Workshop not found')
  }
  
  await prisma.$disconnect()
}

main()
