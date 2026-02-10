const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixCustomerIds() {
  console.log('🔍 Checking bookings with wrong customer ID...')
  
  const wrongCustomerId = 'cml3jmzte000kdlybn0aqsi6i' // Non-existent user
  const correctCustomerId = 'cml3jmzte000jdlybqcf4lv2t' // antonmichl85@gmail.com
  
  // Find all bookings with wrong ID
  const wrongBookings = await prisma.directBooking.findMany({
    where: { customerId: wrongCustomerId },
    select: { 
      id: true, 
      createdAt: true, 
      status: true, 
      paymentStatus: true,
      date: true,
      time: true
    }
  })
  
  console.log(`Found ${wrongBookings.length} bookings with wrong customer ID:`)
  wrongBookings.forEach(b => {
    console.log(`  - ${b.id}: ${b.status}/${b.paymentStatus}, created ${b.createdAt.toISOString()}`)
  })
  
  // Update them
  console.log('\n🔧 Updating customer IDs...')
  const result = await prisma.directBooking.updateMany({
    where: { customerId: wrongCustomerId },
    data: { customerId: correctCustomerId }
  })
  
  console.log(`✅ Updated ${result.count} bookings to correct customer ID`)
  
  // Verify
  const verifyWrong = await prisma.directBooking.count({
    where: { customerId: wrongCustomerId }
  })
  const verifyCorrect = await prisma.directBooking.count({
    where: { customerId: correctCustomerId }
  })
  
  console.log(`\n📊 Verification:`)
  console.log(`  - Wrong ID (${wrongCustomerId}): ${verifyWrong} bookings`)
  console.log(`  - Correct ID (${correctCustomerId}): ${verifyCorrect} bookings`)
}

fixCustomerIds()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
