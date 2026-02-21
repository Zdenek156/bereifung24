const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLastBooking() {
  const booking = await prisma.directBooking.findFirst({
    where: { paymentStatus: 'PAID' },
    orderBy: { paidAt: 'desc' },
    select: {
      id: true,
      totalPrice: true,
      stripePaymentId: true,
      stripeSessionId: true,
      stripeFee: true,
      paymentMethodDetail: true,
      paidAt: true
    }
  });
  
  console.log('Latest paid booking:', JSON.stringify(booking, null, 2));
  await prisma.$disconnect();
}

checkLastBooking().catch(console.error);
