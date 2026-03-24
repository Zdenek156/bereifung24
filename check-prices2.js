const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const lp = await p.workshopLandingPage.findFirst({
    where: { slug: 'reifenservice-muehling' },
    select: {
      workshopId: true,
      workshop: {
        select: {
          name: true,
          workshopServices: {
            select: {
              serviceType: true,
              basePrice: true,
              basePrice4: true,
              estimatedDuration: true,
              montagePrice: true,
              pricePerTire: true,
              mountOnMotorcycle: true
            }
          }
        }
      }
    }
  });
  console.log(JSON.stringify(lp, null, 2));
  await p.$disconnect();
})();
