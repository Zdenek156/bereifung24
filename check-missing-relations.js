const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkMissingRelations() {
  const problematicIds = [
    'cmlghrmmu000c8niq3atpl56y',
    'cmlghrtl1000f8niqi89dgiwi',
    'cmlghs06e000i8niq83upovw2',
    'cmlghs3qt000k8niq8iibv4vc'
  ]
  
  console.log('\n=== Checking DirectBookings with Missing Relations ===\n')
  
  for (const id of problematicIds) {
    const booking = await prisma.directBooking.findUnique({
      where: { id }
    })
    
    if (booking) {
      console.log(`\n--- DirectBooking ${id} ---`)
      console.log(`Date: ${booking.date}`)
      console.log(`Time: ${booking.time}`)
      console.log(`Status: ${booking.status}`)
      console.log(`PaymentStatus: ${booking.paymentStatus}`)
      console.log(`CustomerId: ${booking.customerId}`)
      console.log(`VehicleId: ${booking.vehicleId}`)
      console.log(`WorkshopId: ${booking.workshopId}`)
      console.log(`CreatedAt: ${booking.createdAt}`)
      
      // Check if customer exists
      if (booking.customerId) {
        const customer = await prisma.user.findUnique({
          where: { id: booking.customerId }
        })
        console.log(`Customer EXISTS: ${customer ? 'YES' : 'NO'}`)
        if (customer) {
          console.log(`  - Name: ${customer.name}`)
          console.log(`  - Email: ${customer.email}`)
        }
      } else {
        console.log(`Customer EXISTS: NO (customerId is NULL)`)
      }
      
      // Check if vehicle exists
      if (booking.vehicleId) {
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: booking.vehicleId }
        })
        console.log(`Vehicle EXISTS: ${vehicle ? 'YES' : 'NO'}`)
        if (vehicle) {
          console.log(`  - Make: ${vehicle.make}`)
          console.log(`  - Model: ${vehicle.model}`)
        }
      } else {
        console.log(`Vehicle EXISTS: NO (vehicleId is NULL)`)
      }
    } else {
      console.log(`\nDirectBooking ${id} NOT FOUND`)
    }
  }
  
  // Now check the visible ones
  console.log('\n\n=== Checking Visible DirectBookings ===\n')
  const allBookings = await prisma.directBooking.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  
  for (const booking of allBookings) {
    const customerExists = booking.customerId ? await prisma.user.findUnique({ where: { id: booking.customerId } }) : null
    const vehicleExists = booking.vehicleId ? await prisma.vehicle.findUnique({ where: { id: booking.vehicleId } }) : null
    
    console.log(`\n${booking.id} | ${booking.date.toLocaleDateString('de-DE')} ${booking.time} | ${booking.status}`)
    console.log(`  Customer: ${customerExists ? '✅ ' + customerExists.name : '❌ MISSING'}`)
    console.log(`  Vehicle: ${vehicleExists ? '✅ ' + vehicleExists.make + ' ' + vehicleExists.model : '❌ MISSING'}`)
  }
}

checkMissingRelations()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect())
