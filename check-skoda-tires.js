const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: 'cmisrj9jg000ajcxoo7dyvemu' },
      select: {
        id: true,
        make: true,
        model: true,
        summerTires: true,
        winterTires: true,
        allSeasonTires: true
      }
    });
    
    console.log('=== Skoda Vehicle ===');
    console.log('ID:', vehicle.id);
    console.log('Model:', vehicle.make, vehicle.model);
    console.log('');
    console.log('summerTires:', vehicle.summerTires ? 'EXISTS' : 'NULL');
    console.log('winterTires:', vehicle.winterTires ? 'EXISTS' : 'NULL');
    console.log('allSeasonTires:', vehicle.allSeasonTires ? 'EXISTS' : 'NULL');
    console.log('');
    
    if (vehicle.summerTires) {
      const s = typeof vehicle.summerTires === 'string' ? JSON.parse(vehicle.summerTires) : vehicle.summerTires;
      console.log('✅ Summer:', s.width + '/' + s.aspectRatio + ' R' + s.diameter);
    } else {
      console.log('❌ Summer: NULL');
    }
    
    if (vehicle.winterTires) {
      const w = typeof vehicle.winterTires === 'string' ? JSON.parse(vehicle.winterTires) : vehicle.winterTires;
      console.log('✅ Winter:', w.width + '/' + w.aspectRatio + ' R' + w.diameter);
    } else {
      console.log('❌ Winter: NULL');
    }
    
    if (vehicle.allSeasonTires) {
      const g = typeof vehicle.allSeasonTires === 'string' ? JSON.parse(vehicle.allSeasonTires) : vehicle.allSeasonTires;
      console.log('✅ AllSeason:', g.width + '/' + g.aspectRatio + ' R' + g.diameter);
    } else {
      console.log('❌ AllSeason: NULL');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
