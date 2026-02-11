const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkBooking() {
  try {
    // Get all bookings for the customer
    const bookings = await prisma.directBooking.findMany({
      where: {
        customerId: 'cml3jmzte000kdlybn0aqsi6i'
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        date: true,
        time: true,
        totalPrice: true,
        createdAt: true
      }
    })

    console.log('\n📋 All DirectBookings for customer:')
    console.log('Total:', bookings.length)
    bookings.forEach((b, i) => {
      console.log(`\n${i+1}. ${b.id.slice(0,8)}:`)
      console.log(`   Status: ${b.status} / ${b.paymentStatus}`)
      console.log(`   Date: ${b.date.toISOString().split('T')[0]} ${b.time}`)
      console.log(`   Price: €${b.totalPrice}`)
      console.log(`   Created: ${b.createdAt.toISOString()}`)
    })

    // Check specifically for the new booking
    const newBooking = await prisma.directBooking.findUnique({
      where: {
        id: 'cmlhv9eqd0005vbio3xgv7ixz'
      }
    })

    console.log('\n🔍 New booking (cmlhv9eqd0005vbio3xgv7ixz):')
    if (newBooking) {
      console.log('   Found:', JSON.stringify(newBooking, null, 2))
    } else {
      console.log('   ❌ NOT FOUND!')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBooking()
