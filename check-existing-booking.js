const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkBooking() {
  // Die Request-ID aus der URL: cmj7ouq660003klqndmrk654h
  const requestId = 'cmj7ouq660003klqndmrk654h'
  
  const request = await prisma.tireRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      customer: {
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }
    }
  })
  
  console.log('TireRequest:', request)
  
  const bookings = await prisma.booking.findMany({
    where: {
      tireRequestId: requestId
    },
    select: {
      id: true,
      status: true,
      appointmentDate: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  console.log('\nExisting bookings for this request:', bookings.length)
  bookings.forEach(booking => {
    console.log({
      id: booking.id,
      status: booking.status,
      appointmentDate: booking.appointmentDate,
      createdAt: booking.createdAt
    })
  })
  
  await prisma.$disconnect()
}

checkBooking().catch(console.error)
