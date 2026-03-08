const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    const c = await p.tireCatalog.count({ where: { width: '245', height: '55', diameter: '18' } });
    const cw = await p.tireCatalog.count({ where: { width: '245', height: '55', diameter: '18', season: 'w' } });
    const i = await p.workshopInventory.count({ where: { width: '245', height: '55', diameter: '18' } });
    const iw = await p.workshopInventory.count({ where: { width: '245', height: '55', diameter: '18', season: 'w' } });
    const s = await p.tireCatalog.groupBy({ by: ['season'], where: { width: '245', height: '55', diameter: '18' }, _count: true });
    const si = await p.workshopInventory.groupBy({ by: ['season'], where: { width: '245', height: '55', diameter: '18' }, _count: true });
    console.log('CAT 245/55/18 total:', c, 'winter:', cw);
    console.log('CAT seasons:', JSON.stringify(s));
    console.log('INV 245/55/18 total:', i, 'winter:', iw);
    console.log('INV seasons:', JSON.stringify(si));
    console.log('CAT total count:', await p.tireCatalog.count());
    console.log('INV total count:', await p.workshopInventory.count());
    const samples = await p.tireCatalog.findMany({ take: 3, select: { width: true, height: true, diameter: true, season: true, brand: true } });
    console.log('CAT samples:', JSON.stringify(samples));
  } catch (e) { console.error(e.message); }
  finally { await p.$disconnect(); }
})();
