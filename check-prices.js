const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const lp = await p.workshopLandingPage.findFirst({
    where: { slug: 'reifenservice-muehling' },
    select: {
      workshopId: true,
      workshop: {
        select: {
          companyName: true,
          workshopServices: {
            select: {
              serviceType: true, basePrice: true, basePrice4: true,
              estimatedDuration: true, montagePrice: true, mountOnMotorcycle: true,
              description: true
            }
          }
        }
      }
    }
  });
  if (lp) {
    console.log('Workshop:', lp.workshop.companyName);
    console.log('Workshop ID:', lp.workshopId);
    console.log('\nServices:');
    for (const s of lp.workshop.workshopServices) {
      console.log(`  ${s.serviceType}: basePrice=${s.basePrice}, basePrice4=${s.basePrice4}, montagePrice=${s.montagePrice}, duration=${s.estimatedDuration}, mountOnMotorcycle=${s.mountOnMotorcycle}`);
    }
  } else {
    console.log('Landing page not found');
  }
  await p.$disconnect();
})();
