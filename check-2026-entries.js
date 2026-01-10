const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const entries = await prisma.accountingEntry.findMany({
    where: {
      bookingDate: {
        gte: new Date(2026, 0, 1),
        lte: new Date(2026, 11, 31, 23, 59, 59)
      }
    },
    orderBy: { entryNumber: 'asc' }
  })
  
  console.log(`Found ${entries.length} entries for 2026`)
  if (entries.length > 0) {
    console.log('First entry:', entries[0])
  }
  
  await prisma.$disconnect()
}

check().catch(console.error)
