const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const w = await p.workshop.findFirst({ where: { companyName: { contains: 'Müller' } }, select: { id: true, companyName: true } });
  console.log('Workshop:', JSON.stringify(w));
  const svc = await p.workshopService.findFirst({ where: { workshopId: w.id, serviceType: 'MOTORCYCLE_TIRE' }, include: { servicePackages: true } });
  console.log('Service:', JSON.stringify(svc, null, 2));
  await p.$disconnect();
})();
