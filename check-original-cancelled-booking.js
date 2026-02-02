const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkBooking() {
  const booking = await prisma.booking.findUnique({
    where: { id: 'cmkzqrs6o002nq1ye0anc5uf9' },
    include: {
      workshop: {
        select: { companyName: true }
      },
      employee: {
        select: { name: true, googleCalendarId: true }
      },
      tireRequest: {
        select: { status: true }
      },
      offer: {
        select: { status: true }
      }
    }
  })
  
  console.log('📋 Booking Details:')
  console.log('ID:', booking.id)
  console.log('Status:', booking.status)
  console.log('Appointment:', booking.appointmentDate)
  console.log('Google Event ID:', booking.googleEventId)
  console.log('Workshop:', booking.workshop.companyName)
  console.log('Employee:', booking.employee?.name, booking.employee?.googleCalendarId)
  console.log('TireRequest Status:', booking.tireRequest?.status)
  console.log('Offer Status:', booking.offer?.status)
  console.log('Workshop Notes:', booking.workshopNotes)
  console.log('Created:', booking.createdAt)
  console.log('Updated:', booking.updatedAt)
  
  await prisma.$disconnect()
}

checkBooking().catch(console.error)
