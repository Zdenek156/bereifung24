const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Find the request that has offers with these specific tire brands
    const offers = await prisma.offer.findMany({
      where: {
        workshopId: 'cmi9c1qzn000110hd0838ppwx',
        status: 'PENDING'
      },
      include: {
        tireRequest: true,
        tireOptions: true
      }
    });

    console.log('\n=== PENDING OFFERS WITH TIRE OPTIONS ===');
    for (const offer of offers) {
      console.log(`\n--- Offer ${offer.id.slice(-8)} ---`);
      console.log('Request ID:', offer.tireRequestId);
      console.log('Price:', offer.price, '€');
      console.log('Installation Fee:', offer.installationFee, '€');
      console.log('Status:', offer.status);
      
      if (offer.tireOptions && offer.tireOptions.length > 0) {
        console.log('\nTire Options:');
        offer.tireOptions.forEach(opt => {
          console.log(`  - Brand: ${opt.tireBrand || 'Unknown'}: ${opt.pricePerTire} € per tire (${opt.quantity} tires)`);
        });
      } else {
        console.log('No tire options');
      }
      
      if (offer.tireRequest) {
        console.log('\nRequest Details:');
        console.log('Quantity:', offer.tireRequest.quantity);
        console.log('Width:', offer.tireRequest.width);
        console.log('Notes:', offer.tireRequest.additionalNotes?.substring(0, 150));
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
