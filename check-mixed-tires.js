const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  // Check 245/35/21 and 275/30/21 for summer season
  const frontSummer = await p.tireCatalog.count({ where: { width: '245', height: '35', diameter: '21', season: 's' } });
  const rearSummer = await p.tireCatalog.count({ where: { width: '275', height: '30', diameter: '21', season: 's' } });
  const rearAll = await p.tireCatalog.count({ where: { width: '275', height: '30', diameter: '21' } });
  
  const frontSeasons = await p.tireCatalog.groupBy({ by: ['season'], where: { width: '245', height: '35', diameter: '21' }, _count: true });
  const rearSeasons = await p.tireCatalog.groupBy({ by: ['season'], where: { width: '275', height: '30', diameter: '21' }, _count: true });
  
  console.log('=== FRONT 245/35 R21 ===');
  console.log('Summer count:', frontSummer);
  console.log('Seasons:', JSON.stringify(frontSeasons));
  
  console.log('\n=== REAR 275/30 R21 ===');
  console.log('Summer count:', rearSummer);
  console.log('All seasons count:', rearAll);
  console.log('Seasons:', JSON.stringify(rearSeasons));
  
  // Also check WorkshopInventory
  const invFrontS = await p.workshopInventory.count({ where: { width: 245, height: 35, diameter: 21, season: 's' } });
  const invRearS = await p.workshopInventory.count({ where: { width: 275, height: 30, diameter: 21, season: 's' } });
  const invRearAll = await p.workshopInventory.count({ where: { width: 275, height: 30, diameter: 21 } });
  
  console.log('\n=== WorkshopInventory ===');
  console.log('Front 245/35/21 summer:', invFrontS);
  console.log('Rear 275/30/21 summer:', invRearS);
  console.log('Rear 275/30/21 ALL:', invRearAll);
  
  await p.$disconnect();
})();
