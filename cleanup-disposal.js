const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.servicePackage.deleteMany({
    where: {
      OR: [
        { packageType: 'two_tires_disposal' },
        { packageType: 'four_tires_disposal' }
      ]
    }
  })
  console.log('Gelöschte alte Disposal-Pakete:', result.count)
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect() })
