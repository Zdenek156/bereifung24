const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('🔍 Checking CO2 data...\n');
  
  // Check CO2 Settings
  const settings = await prisma.cO2Settings.findFirst();
  console.log('CO2Settings exists:', !!settings);
  if (settings) {
    console.log('  - workshopsToCompare:', settings.workshopsToCompare);
    console.log('  - co2PerKmCombustion:', settings.co2PerKmCombustion);
  }
  
  // Check TireRequests with CO2
  const requestsWithCO2 = await prisma.tireRequest.count({
    where: { savedCO2Grams: { not: null } }
  });
  const totalRequests = await prisma.tireRequest.count();
  console.log('\n📊 Tire Requests:');
  console.log('  - Total:', totalRequests);
  console.log('  - With CO2 data:', requestsWithCO2);
  
  // Check Accepted Offers
  const acceptedOffers = await prisma.offer.count({
    where: { status: 'ACCEPTED' }
  });
  console.log('\n✅ Accepted Offers:', acceptedOffers);
  
  // Show some sample data
  const sampleRequests = await prisma.tireRequest.findMany({
    where: { savedCO2Grams: { not: null } },
    take: 3,
    select: {
      id: true,
      savedCO2Grams: true,
      status: true,
      createdAt: true
    }
  });
  
  if (sampleRequests.length > 0) {
    console.log('\n📋 Sample Requests with CO2:');
    sampleRequests.forEach(req => {
      console.log(`  - ${req.id}: ${req.savedCO2Grams}g CO2 (Status: ${req.status})`);
    });
  }
  
  await prisma.$disconnect();
})();
