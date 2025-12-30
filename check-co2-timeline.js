const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('🔍 Checking when CO2 feature was deployed...\n');
  
  // Check CO2Settings creation date
  const settings = await prisma.cO2Settings.findFirst({
    select: { id: true, updatedAt: true }
  });
  console.log('CO2Settings last updated:', settings?.updatedAt);
  
  // Check accepted offers timeline
  const acceptedOffers = await prisma.offer.findMany({
    where: { status: 'ACCEPTED' },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    select: {
      id: true,
      updatedAt: true,
      tireRequestId: true,
      tireRequest: {
        select: {
          savedCO2Grams: true
        }
      }
    }
  });
  
  console.log('\n📊 Last 10 accepted offers:');
  acceptedOffers.forEach(offer => {
    console.log(`  - Offer ${offer.id.substring(0, 8)}: accepted at ${offer.updatedAt}, CO2: ${offer.tireRequest.savedCO2Grams || 'NOT CALCULATED'}`);
  });
  
  await prisma.$disconnect();
})();
