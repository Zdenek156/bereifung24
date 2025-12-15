const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const request = await prisma.tireRequest.findUnique({
      where: { id: 'cmj70u8d40001woktunopsci5' },
      select: { 
        additionalNotes: true,
        offers: {
          select: {
            id: true,
            tireOptions: {
              select: {
                brand: true,
                model: true,
                pricePerTire: true,
                montagePrice: true,
                carTireType: true
              }
            }
          }
        }
      }
    });
    
    console.log('=== REQUEST DATA ===');
    console.log('additionalNotes:', request?.additionalNotes);
    console.log('\n=== OFFERS ===');
    request?.offers.forEach((offer, i) => {
      console.log(`\nOffer ${i + 1} (${offer.id}):`);
      offer.tireOptions.forEach((opt, j) => {
        console.log(`  Option ${j + 1}:`, {
          brand: opt.brand,
          model: opt.model,
          pricePerTire: opt.pricePerTire,
          montagePrice: opt.montagePrice,
          carTireType: opt.carTireType
        });
      });
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
