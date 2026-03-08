const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  // Check suppliers for 275/30/21 summer
  const rearBySupplier = await p.tireCatalog.groupBy({
    by: ['supplier'],
    where: { width: '275', height: '30', diameter: '21', season: 's' },
    _count: true
  });
  console.log('=== Rear 275/30 R21 SUMMER by supplier ===');
  console.log(JSON.stringify(rearBySupplier, null, 2));

  // Check suppliers for 245/35/21 summer
  const frontBySupplier = await p.tireCatalog.groupBy({
    by: ['supplier'],
    where: { width: '245', height: '35', diameter: '21', season: 's' },
    _count: true
  });
  console.log('\n=== Front 245/35 R21 SUMMER by supplier ===');
  console.log(JSON.stringify(frontBySupplier, null, 2));

  // Check workshop suppliers
  const workshopSuppliers = await p.workshopSupplier.findMany({
    where: { isActive: true },
    select: { workshopId: true, supplier: true, connectionType: true }
  });
  console.log('\n=== Active Workshop Suppliers ===');
  console.log(JSON.stringify(workshopSuppliers, null, 2));

  // Check DB mode (WorkshopInventory) for 275/30/21
  const invRear = await p.workshopInventory.findMany({
    where: {
      width: 275,
      height: 30,
      diameter: 21
    },
    select: {
      workshopId: true,
      season: true,
      brand: true,
      model: true,
      stock: true
    },
    take: 10
  });
  console.log('\n=== WorkshopInventory 275/30/21 ALL ===');
  console.log(JSON.stringify(invRear, null, 2));

  // Check how many active tires for rear (not DEMO, not DOT)
  const rearActive = await p.tireCatalog.count({
    where: {
      width: '275',
      height: '30',
      diameter: '21',
      season: 's',
      isActive: true,
      AND: [
        { NOT: { model: { contains: 'DEMO', mode: 'insensitive' } } },
        { NOT: { model: { contains: 'DOT', mode: 'insensitive' } } }
      ]
    }
  });
  console.log('\n=== Rear 275/30/21 SUMMER (active, no DEMO/DOT) ===');
  console.log('Count:', rearActive);

  // Show first few rear tires
  const rearSample = await p.tireCatalog.findMany({
    where: {
      width: '275',
      height: '30',
      diameter: '21',
      season: 's',
      isActive: true
    },
    select: {
      articleId: true,
      brand: true,
      model: true,
      supplier: true,
      loadIndex: true,
      speedIndex: true
    },
    take: 5
  });
  console.log('\n=== Sample rear tires ===');
  console.log(JSON.stringify(rearSample, null, 2));

  await p.$disconnect();
})();
