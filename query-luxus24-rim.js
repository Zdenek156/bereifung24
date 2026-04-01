const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.workshopTireChangePricing.findMany({
  where: { workshopId: 'cml3g7rxd000ckeyn9ypqgg65', isActive: true },
  orderBy: { rimSize: 'asc' }
}).then(r => {
  r.forEach(x => console.log('Rim', x.rimSize, '|', Number(x.pricePerTire), 'EUR/Reifen |', x.durationPerTire, 'min/Reifen'));
  p.$disconnect();
});
