const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkConfirmedBookings() {
  const confirmedIds = [
    'cml817z4i0007kv8d6n50tnxj',
    'cml7zt9bc0007s37awbpb48zy'
  ]
  
  console.log('\n=== Checking CONFIRMED Bookings (19.2.2026) ===\n')
  
  for (const id of confirmedIds) {
    const booking = await prisma.directBooking.findUnique({
      where: { id }
    })
    
    if (booking) {
      console.log(`\n--- DirectBooking ${id} ---`)
      console.log(`Date: ${booking.date.toLocaleDateString('de-DE')}`)
      console.log(`Time: ${booking.time}`)
      console.log(`Status: ${booking.status}`)
      console.log(`PaymentStatus: ${booking.paymentStatus}`)
      console.log(`PaymentId: ${booking.paymentId}`)
      console.log(`PaymentMethod: ${booking.paymentMethod}`)
      console.log(`PaidAt: ${booking.paidAt}`)
      console.log(`CustomerId: ${booking.customerId}`)
      console.log(`VehicleId: ${booking.vehicleId}`)
      console.log(`CreatedAt: ${booking.createdAt.toLocaleString('de-DE')}`)
      
      // Check customer
      if (booking.customerId) {
        const customer = await prisma.user.findUnique({
          where: { id: booking.customerId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true
          }
        })
        console.log(`\nCustomer:`)
        if (customer) {
          console.log(`  ✅ EXISTS`)
          console.log(`  ID: ${customer.id}`)
          console.log(`  Email: ${customer.email}`)
          console.log(`  FirstName: ${customer.firstName}`)
          console.log(`  LastName: ${customer.lastName}`)
          console.log(`  Role: ${customer.role}`)
          console.log(`  Created: ${customer.createdAt.toLocaleString('de-DE')}`)
        } else {
          console.log(`  ❌ NOT FOUND (ID: ${booking.customerId})`)
        }
      } else {
        console.log(`\nCustomer: NULL`)
      }
      
      // Check vehicle
      if (booking.vehicleId) {
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: booking.vehicleId }
        })
        console.log(`\nVehicle:`)
        if (vehicle) {
          console.log(`  ✅ EXISTS`)
          console.log(`  ${vehicle.make} ${vehicle.model}`)
          console.log(`  License: ${vehicle.licensePlate}`)
        } else {
          console.log(`  ❌ NOT FOUND`)
        }
      }
    }
  }
}

checkConfirmedBookings()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect())
