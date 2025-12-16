const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listRecentRequests() {
  const requests = await prisma.tireRequest.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      customer: {
        select: {
          userId: true
        }
      }
    }
  })
  
  console.log('Recent TireRequests:')
  requests.forEach(req => {
    console.log({
      id: req.id,
      status: req.status,
      createdAt: req.createdAt,
      customerId: req.customer?.userId
    })
  })
  
  // Now check bookings for each
  console.log('\n--- Checking bookings ---')
  for (const req of requests) {
    const bookings = await prisma.booking.findMany({
      where: { tireRequestId: req.id },
      select: {
        id: true,
        status: true,
        appointmentDate: true
      }
    })
    if (bookings.length > 0) {
      console.log(`\nRequest ${req.id} has ${bookings.length} booking(s):`)
      bookings.forEach(b => console.log(`  - ${b.status} on ${b.appointmentDate}`))
    }
  }
  
  await prisma.$disconnect()
}

listRecentRequests().catch(console.error)
