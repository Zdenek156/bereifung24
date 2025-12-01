const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBookings() {
  try {
    console.log('=== Checking Bookings with Offers ===\n');
    
    const bookings = await prisma.booking.findMany({
      where: {
        offer: {
          isNot: null
        }
      },
      select: {
        id: true,
        status: true,
        appointmentDate: true,
        completedAt: true,
        createdAt: true,
        workshop: {
          select: {
            companyName: true
          }
        },
        offer: {
          select: {
            price: true,
            status: true
          }
        }
      },
      take: 20,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${bookings.length} bookings with offers:\n`);
    
    bookings.forEach((booking, i) => {
      console.log(`${i+1}. Booking ${booking.id.substring(0, 8)}...`);
      console.log(`   Workshop: ${booking.workshop.companyName}`);
      console.log(`   Booking Status: ${booking.status}`);
      console.log(`   Offer Status: ${booking.offer.status}`);
      console.log(`   Offer Price: ${booking.offer.price}€`);
      console.log(`   Appointment Date: ${booking.appointmentDate}`);
      console.log(`   Completed At: ${booking.completedAt || 'Not completed'}`);
      console.log(`   Created At: ${booking.createdAt}`);
      console.log('');
    });
    
    // Count by status
    const statusCounts = {};
    bookings.forEach(b => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    });
    
    console.log('Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookings();
