const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const p = new PrismaClient();

(async () => {
  const pages = await p.workshopLandingPage.findMany({
    select: { id: true, workshopId: true, heroImage: true },
  });
  
  let fixed = 0;
  for (const pg of pages) {
    if (!pg.heroImage) continue;
    const filePath = path.join('/var/www/bereifung24/public', pg.heroImage);
    if (!fs.existsSync(filePath)) {
      console.log('Fixing:', pg.workshopId, pg.heroImage);
      await p.workshopLandingPage.update({
        where: { id: pg.id },
        data: { heroImage: null },
      });
      fixed++;
    }
  }
  console.log('Fixed', fixed, 'stale heroImage entries');
  await p.$disconnect();
})();
