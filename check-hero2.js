const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    const pages = await p.workshopLandingPage.findMany({
      select: {
        id: true,
        workshopId: true,
        slug: true,
        heroImage: true,
        isActive: true
      }
    });
    console.log('=== LANDING PAGES ===');
    pages.forEach(pg => {
      console.log('ID:', pg.id);
      console.log('Workshop:', pg.workshopId);
      console.log('Slug:', pg.slug);
      console.log('Active:', pg.isActive);
      console.log('Hero:', pg.heroImage || 'NULL');
      console.log('---');
    });
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await p.$disconnect();
  }
})();
