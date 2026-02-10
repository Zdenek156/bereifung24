const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listAllWorkshopBookings() {
  const workshopId = 'cml3g7rxd000ckeyn9ypqgg65'
  
  const bookings = await prisma.directBooking.findMany({
    where: { workshopId },
    orderBy: { createdAt: 'desc' }
  })
  
  console.log(`\n=== ALL DirectBookings for Workshop ${workshopId} ===\n`)
  
  bookings.forEach((b, i) => {
    const customerIdShort = b.customerId ? b.customerId.slice(-8) : 'NULL'
    console.log(`${i+1}. ID: ${b.id.slice(-8)} | Created: ${b.createdAt.toLocaleDateString('de-DE')} | Appointment: ${b.date.toLocaleDateString('de-DE')} ${b.time} | Status: ${b.status} | CustomerId: ${customerIdShort}`)
  })
  
  console.log(`\nTotal: ${bookings.length}`)
  
  // Count by status
  const statusCount = {}
  bookings.forEach(b => {
    statusCount[b.status] = (statusCount[b.status] || 0) + 1
  })
  
  console.log('\nBy Status:')
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`)
  })
}

listAllWorkshopBookings()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect())
