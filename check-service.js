const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: 'cmky1y02b00013c0mpmyd2b0h' }
    });
    
    const service = await prisma.workshopService.findFirst({
      where: {
        workshopId: offer.workshopId,
        serviceType: 'TIRE_CHANGE',
        isActive: true
      }
    });
    
    console.log('=== WORKSHOP SERVICE ===');
    console.log('BasePrice (2 Reifen):', service.basePrice);
    console.log('BasePrice4 (4 Reifen):', service.basePrice4);
    console.log('DisposalFee:', service.disposalFee);
    console.log('RunFlatSurcharge:', service.runFlatSurcharge);
    
    console.log('\n=== CALCULATION ===');
    console.log('Selected: Pirelli 100 × 2 = 200€');
    console.log('InstallationFee (2 Reifen): ' + service.basePrice + '€');
    console.log('SHOULD BE: ' + (200 + parseFloat(service.basePrice)) + '€');
    console.log('ACTUAL IN DB: 222€');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
