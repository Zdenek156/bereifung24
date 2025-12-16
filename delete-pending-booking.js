const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.booking.deleteMany({
    where: {
      tireRequestId: 'cmj7n3iyf0001xzzlsck9ymlv',
      status: 'PENDING'
    }
  })
  console.log('Deleted', result.count, 'PENDING bookings')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
