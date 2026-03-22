const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Find the most recent direct bookings
    const bookings = await prisma.directBooking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, status: true, paymentStatus: true, serviceType: true,
        date: true, time: true, totalPrice: true, createdAt: true,
        customerId: true,
        customer: { select: { userId: true, user: { select: { email: true } } } },
        workshop: { select: { companyName: true } }
      }
    });
    console.log('=== Last 5 Direct Bookings ===');
    bookings.forEach(b => {
      console.log(`${b.id} | ${b.status} | ${b.paymentStatus} | ${b.workshop.companyName} | ${b.serviceType} | ${b.date} ${b.time} | ${b.totalPrice}€ | customer: ${b.customer.user.email} (${b.customerId}) | created: ${b.createdAt}`);
    });

    // Check if the user's customer record matches
    const zdenek = await prisma.user.findFirst({
      where: { email: 'zdenek156@gmail.com' },
      select: { id: true, email: true }
    });
    console.log('\n=== Zdenek User ===', zdenek);
    
    if (zdenek) {
      const customer = await prisma.customer.findUnique({
        where: { userId: zdenek.id },
        select: { id: true, userId: true }
      });
      console.log('=== Customer record ===', customer);

      if (customer) {
        const count = await prisma.directBooking.count({
          where: { customerId: customer.id, status: { in: ['CONFIRMED', 'COMPLETED'] } }
        });
        console.log(`=== Zdenek CONFIRMED/COMPLETED DirectBookings: ${count} ===`);
      }
    }

    // Also check for Google Calendar tokens on the workshop
    const luxus = await prisma.workshop.findFirst({
      where: { companyName: { contains: 'Luxus', mode: 'insensitive' } },
      select: { 
        id: true, companyName: true,
        googleCalendarId: true,
        googleAccessToken: true, 
        googleRefreshToken: true,
        googleTokenExpiry: true,
        emailNotifyBookings: true
      }
    });
    console.log('\n=== Luxus24 Google Calendar/Email config ===');
    console.log('calendarId:', luxus?.googleCalendarId || 'NOT SET');
    console.log('accessToken:', luxus?.googleAccessToken ? 'SET (length: ' + luxus.googleAccessToken.length + ')' : 'NOT SET');
    console.log('refreshToken:', luxus?.googleRefreshToken ? 'SET (length: ' + luxus.googleRefreshToken.length + ')' : 'NOT SET');
    console.log('tokenExpiry:', luxus?.googleTokenExpiry || 'NOT SET');
    console.log('emailNotifyBookings:', luxus?.emailNotifyBookings);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
