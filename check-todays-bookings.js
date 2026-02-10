const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTodaysBookings() {
  try {
    console.log('=== CHECKING RESERVED BOOKINGS TODAY ===\n');

    const reservedBookings = await prisma.directBooking.findMany({
      where: {
        status: 'RESERVED',
        createdAt: {
          gte: new Date('2026-02-10T00:00:00')
        }
      },
      select: {
        id: true,
        date: true,
        time: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        paymentId: true,
        paidAt: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      select: {
        id: true,
        date: true,
        time: true,
        customerId: true,
        vehicleId: true,
        workshopId: true,
        status: true,
        paymentStatus: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`RESERVED bookings today: ${reservedBookings.length}\n`);

    if (reservedBookings.length > 0) {
      console.log('Bookings details:');
      reservedBookings.forEach((booking, index) => {
        console.log(`\n${index + 1}. Booking ID: ${booking.id}`);
        console.log(`   Date: ${booking.date}`);
        console.log(`   Time: ${booking.time}`);
        console.log(`   Customer ID: ${booking.customerId || 'NULL ❌'}`);
        console.log(`   Vehicle ID: ${booking.vehicleId || 'NULL ❌'}`);
        console.log(`   Workshop ID: ${booking.workshopId}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Payment Status: ${booking.paymentStatus}`);
        console.log(`   Payment ID: ${booking.paymentId || 'NULL'}`);
        console.log(`   Paid At: ${booking.paidAt || 'NULL'}`);
        console.log(`   Created: ${booking.createdAt}`);
      });

      const withPaymentId = reservedBookings.filter(b => b.paymentId);
      const withoutPaymentId = reservedBookings.filter(b => !b.paymentId);

      console.log(`\n=== SUMMARY ===`);
      console.log(`Total RESERVED: ${reservedBookings.length}`);
      console.log(`With Payment ID: ${withPaymentId.length} (Payment was made)`);
      console.log(`Without Payment ID: ${withoutPaymentId.length} (No payment yet)`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTodaysBookings();
