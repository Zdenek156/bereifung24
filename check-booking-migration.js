const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkBookingMigration() {
  console.log('=== Checking DirectBooking Migration Status ===\n')
  
  // 1. Check the test user
  const user = await prisma.user.findUnique({
    where: { email: 'antonmichl85@gmail.com' },
    select: { id: true, email: true, firstName: true, lastName: true }
  })
  
  if (!user) {
    console.log('❌ User not found: antonmichl85@gmail.com')
    return
  }
  
  console.log('✅ User found:', user)
  
  // 2. Check if Customer record exists
  const customer = await prisma.customer.findUnique({
    where: { userId: user.id },
    select: { id: true, userId: true, createdAt: true }
  })
  
  if (!customer) {
    console.log('❌ No Customer record found for this user!')
    console.log('   Creating Customer record...')
    
    const newCustomer = await prisma.customer.create({
      data: { userId: user.id }
    })
    console.log('✅ Customer record created:', newCustomer)
    return
  }
  
  console.log('✅ Customer record found:', customer)
  
  // 3. Check DirectBookings for this customer
  const bookings = await prisma.directBooking.findMany({
    where: { customerId: customer.id },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      date: true,
      time: true,
      totalPrice: true
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  })
  
  console.log(`\n📊 Found ${bookings.length} DirectBookings for this customer:\n`)
  
  const statusCounts = {
    RESERVED: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0
  }
  
  bookings.forEach((b, idx) => {
    console.log(`${idx + 1}. ID: ${b.id.slice(-8)}`)
    console.log(`   Status: ${b.status} | Payment: ${b.paymentStatus}`)
    console.log(`   Date: ${b.date.toISOString().split('T')[0]} ${b.time}`)
    console.log(`   Created: ${b.createdAt.toISOString()}`)
    console.log(`   Price: €${b.totalPrice}`)
    console.log()
    
    statusCounts[b.status]++
  })
  
  console.log('📈 Status Summary:')
  console.log(`   RESERVED: ${statusCounts.RESERVED}`)
  console.log(`   CONFIRMED: ${statusCounts.CONFIRMED}`)
  console.log(`   COMPLETED: ${statusCounts.COMPLETED}`)
  console.log(`   CANCELLED: ${statusCounts.CANCELLED}`)
  
  // 4. Check if there are any orphaned bookings (old User.id references)
  console.log('\n🔍 Checking for orphaned bookings...')
  
  const allBookings = await prisma.directBooking.findMany({
    select: { id: true, customerId: true }
  })
  
  let orphanCount = 0
  for (const booking of allBookings) {
    const custExists = await prisma.customer.findUnique({
      where: { id: booking.customerId }
    })
    if (!custExists) {
      orphanCount++
      console.log(`   ⚠️ Orphaned booking: ${booking.id} (customer_id: ${booking.customerId})`)
    }
  }
  
  if (orphanCount === 0) {
    console.log('   ✅ No orphaned bookings found')
  } else {
    console.log(`   ❌ Found ${orphanCount} orphaned bookings!`)
  }
  
  await prisma.$disconnect()
}

checkBookingMigration().catch(console.error)
