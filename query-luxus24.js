const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  // WHEEL_CHANGE
  const ws = await p.workshopService.findFirst({
    where: { workshop: { id: 'cml3g7rxd000ckeyn9ypqgg65' }, serviceType: 'WHEEL_CHANGE', isActive: true },
    include: { servicePackages: { where: { isActive: true } } }
  });
  if (ws) {
    console.log('\n=== WHEEL_CHANGE ===');
    console.log('durationMinutes:', ws.durationMinutes, '| durationMinutes4:', ws.durationMinutes4);
    ws.servicePackages.forEach(p => console.log(' ', p.packageType, '|', Number(p.price), 'EUR |', p.durationMinutes, 'min'));
  } else {
    console.log('No WHEEL_CHANGE');
  }

  // TIRE_CHANGE
  const tc = await p.workshopService.findFirst({
    where: { workshop: { id: 'cml3g7rxd000ckeyn9ypqgg65' }, serviceType: 'TIRE_CHANGE', isActive: true },
    include: { servicePackages: { where: { isActive: true } } }
  });
  if (tc) {
    console.log('\n=== TIRE_CHANGE ===');
    console.log('durationMinutes:', tc.durationMinutes, '| durationMinutes4:', tc.durationMinutes4, '| balancingMinutes:', tc.balancingMinutes);
    tc.servicePackages.forEach(p => console.log(' ', p.packageType, '|', Number(p.price), 'EUR |', p.durationMinutes, 'min'));
  }

  // TireChangePricing (per rim size)
  const tcp = await p.tireChangePricing.findMany({
    where: { workshopId: 'cml3g7rxd000ckeyn9ypqgg65', isActive: true },
    orderBy: { rimSize: 'asc' }
  });
  if (tcp.length > 0) {
    console.log('\n=== TIRE_CHANGE_PRICING (per rim) ===');
    tcp.forEach(p => console.log('  Rim', p.rimSize, '|', Number(p.pricePerTire), 'EUR/Reifen |', p.durationPerTire, 'min/Reifen'));
  }

  await p.$disconnect();
})();
