const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const p = new PrismaClient();

(async () => {
  const pages = await p.workshopLandingPage.findMany({
    select: { id: true, workshopId: true, heroImage: true },
  });
  for (const pg of pages) {
    if (!pg.heroImage) continue;
    const filePath = path.join('/var/www/bereifung24/public', pg.heroImage);
    const exists = fs.existsSync(filePath);
    console.log(pg.workshopId, pg.heroImage, exists ? 'EXISTS' : 'MISSING');
  }
  await p.$disconnect();
})();
