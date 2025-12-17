const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkLatestBooking() {
  try {
    const latestBooking = await prisma.booking.findFirst({
      where: {
        tireRequestId: 'cmj9t0q6k0006kc09hyugwvbm'
      },
      include: {
        employee: true
      }
    })
    
    console.log('Latest Booking:', JSON.stringify(latestBooking, null, 2))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLatestBooking()
