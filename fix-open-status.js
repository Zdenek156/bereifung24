const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Updating OPEN requests to PENDING...\n')
  
  const result = await prisma.tireRequest.updateMany({
    where: {
      status: 'OPEN'
    },
    data: {
      status: 'PENDING'
    }
  })

  console.log(`Updated ${result.count} requests from OPEN to PENDING`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
