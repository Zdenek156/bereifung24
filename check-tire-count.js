const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  // Check 245/35 R21 summer tires
  const count245 = await prisma.workshopInventory.count({
    where: {
      AND: [
        { workshopId: 'cml3g7rxd000ckeyn9ypqgg65' },
        { width: '245' },
        { height: '35' },
        { diameter: '21' },
        { season: 's' },
        { vehicleType: 'PKW' },
        { stock: { gte: 2 } },
        { NOT: { model: { contains: 'DEMO', mode: 'insensitive' } } },
        { NOT: { model: { contains: 'DOT', mode: 'insensitive' } } }
      ]
    }
  });

  // Check 275/30 R21 summer tires
  const count275 = await prisma.workshopInventory.count({
    where: {
      AND: [
        { workshopId: 'cml3g7rxd000ckeyn9ypqgg65' },
        { width: '275' },
        { height: '30' },
        { diameter: '21' },
        { season: 's' },
        { vehicleType: 'PKW' },
        { stock: { gte: 2 } },
        { NOT: { model: { contains: 'DEMO', mode: 'insensitive' } } },
        { NOT: { model: { contains: 'DOT', mode: 'insensitive' } } }
      ]
    }
  });

  // Check 225/45 R17 for Skoda
  const count225 = await prisma.workshopInventory.count({
    where: {
       AND: [
        { workshopId: 'cml3g7rxd000ckeyn9ypqgg65' },
        { width: '225' },
        { height: '45' },
        { diameter: '17' },
        { season: 's' },
        { vehicleType: 'PKW' },
        { stock: { gte: 4 } },
        { NOT: { model: { contains: 'DEMO', mode: 'insensitive' } } },
        { NOT: { model: { contains: 'DOT', mode: 'insensitive' } } }
      ]
    }
  });

  console.log('===== TIRE AVAILABILITY CHECK =====');
  console.log('BMW X3 2015 (Mixed):');
  console.log(`  245/35 R21 (front): ${count245} tire models`);
  console.log(`  275/30 R21 (rear): ${count275} tire models`);
  console.log('');
  console.log('Skoda Octavia 2025:');
  console.log(`  225/45 R17: ${count225} tire models`);

  await prisma.$disconnect();
})();
