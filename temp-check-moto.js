const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const services = await p.workshopService.findMany({
    where: { serviceType: 'MOTORCYCLE_TIRE' },
    include: {
      workshop: { select: { companyName: true, latitude: true, longitude: true } },
      servicePackages: true
    }
  });
  console.log('Total MOTORCYCLE_TIRE services:', services.length);
  for (const x of services) {
    console.log('\nWorkshop:', x.workshop.companyName, '| Active:', x.isActive, '| Lat:', x.workshop.latitude, 'Lon:', x.workshop.longitude);
    console.log('  disposalFee:', x.disposalFee, '| basePrice:', x.basePrice);
    for (const pkg of x.servicePackages) {
      console.log('  Package:', pkg.packageType, '| Price:', Number(pkg.price), '| Active:', pkg.isActive, '| Duration:', pkg.durationMinutes);
    }
  }
  await p.$disconnect();
})();
