const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  // Check 245/35 R21 summer tires at Luxus24
  const front245 = await prisma.workshopInventory.findMany({
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
    },
    select: {
      brand: true,
      model: true,
      stock: true,
      sellingPrice: true
    },
    take: 10
  });

  console.log('\n=== 245/35 R21 Summer Tires ===');
  console.log('Found:', front245.length, 'tire models');
  front245.forEach(t => console.log(`${t.brand} ${t.model}: ${t.stock} @ ${t.sellingPrice}€`));

  // Check 275/30 R21 summer tires
  const rear275 = await prisma.workshopInventory.findMany({
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
    },
    select: {
      brand: true,
      model: true,
      stock: true,
      sellingPrice: true
    },
    take: 10
  });

  console.log('\n=== 275/30 R21 Summer Tires ===');
  console.log('Found:', rear275.length, 'tire models');
  rear275.forEach(t => console.log(`${t.brand} ${t.model}: ${t.stock} @ ${t.sellingPrice}€`));

  // Check 225/45 R17 for Skoda
  const skoda225 = await prisma.workshopInventory.findMany({
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
    },
    select: {
      brand: true,
      model: true,
      stock: true,
      sellingPrice: true
    },
    take: 10
  });

  console.log('\n=== 225/45 R17 Summer Tires (Skoda) ===');
  console.log('Found:', skoda225.length, 'tire models');
  skoda225.forEach(t => console.log(`${t.brand} ${t.model}: ${t.stock} @ ${t.sellingPrice}€`));

  await prisma.$disconnect();
})();
