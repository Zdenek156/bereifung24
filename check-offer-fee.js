const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Get latest offer for this workshop
    const offer = await prisma.offer.findFirst({
      where: {
        workshopId: 'cmi9c1qzn000110hd0838ppwx'
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        workshop: {
          include: {
            workshopServices: {
              where: {
                isActive: true,
                serviceType: 'TIRE_CHANGE'
              },
              include: {
                servicePackages: {
                  where: {
                    isActive: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!offer) {
      console.log('No offer found');
      return;
    }

    console.log('\n=== OFFER DATA ===');
    console.log('Offer ID:', offer.id);
    console.log('Created:', offer.createdAt);
    console.log('Price:', offer.price, '€');
    console.log('Installation Fee (stored):', offer.installationFee, '€');
    console.log('Duration:', offer.durationMinutes, 'min');

    console.log('\n=== WORKSHOP SERVICES ===');
    const tireService = offer.workshop.workshopServices[0];
    if (tireService) {
      console.log('Base Price:', tireService.basePrice, '€');
      console.log('Base Price (4 tires):', tireService.basePrice4, '€');
      console.log('Disposal Fee (per tire):', tireService.disposalFee, '€');
      console.log('RunFlat Surcharge:', tireService.runFlatSurcharge, '€');
      
      console.log('\n=== SERVICE PACKAGES ===');
      tireService.servicePackages.forEach(pkg => {
        console.log(`- ${pkg.packageType}: ${pkg.price} € (${pkg.durationMinutes} min)`);
      });
      
      // Calculate what the fee SHOULD be for 4 tires + disposal
      const expectedFee = (tireService.basePrice4 || tireService.basePrice * 4) + (tireService.disposalFee * 4);
      console.log('\n=== EXPECTED FEE ===');
      console.log('Calculation:', `${tireService.basePrice4 || tireService.basePrice * 4} € (montage) + ${tireService.disposalFee * 4} € (disposal)`);
      console.log('Expected Total:', expectedFee, '€');
      console.log('Actual in DB:', offer.installationFee, '€');
      console.log('Difference:', expectedFee - offer.installationFee, '€');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
