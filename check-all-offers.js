const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Get all offers for this workshop's latest request
    const offers = await prisma.offer.findMany({
      where: {
        workshopId: 'cmi9c1qzn000110hd0838ppwx'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      include: {
        tireRequest: true
      }
    });

    console.log('\n=== ALL RECENT OFFERS ===');
    offers.forEach((offer, idx) => {
      console.log(`\n--- Offer ${idx + 1} ---`);
      console.log('ID:', offer.id);
      console.log('Created:', offer.createdAt);
      console.log('Request ID:', offer.serviceRequestId);
      console.log('Price:', offer.price, '€');
      console.log('Installation Fee:', offer.installationFee, '€');
      console.log('Duration:', offer.durationMinutes, 'min');
      console.log('Status:', offer.status);
      if (offer.tireRequest) {
        console.log('Request Notes:', offer.tireRequest.additionalNotes?.substring(0, 100));
      }
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
