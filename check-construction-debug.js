const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  // 1. Reifen ohne Bauart-Bezeichnung
  const nullCount = await prisma.tireCatalog.count({
    where: { vehicleType: 'Motorrad', construction: null }
  });
  const nullSamples = await prisma.tireCatalog.findMany({
    where: { vehicleType: 'Motorrad', construction: null },
    select: { id: true, brand: true, model: true, width: true, height: true, diameter: true, construction: true },
    take: 10
  });
  console.log('=== REIFEN OHNE BAUART (NULL) ===');
  console.log('Anzahl:', nullCount);
  nullSamples.forEach(t => console.log(' ', t.brand, t.model, t.width + '/' + t.height + ' R' + t.diameter));

  // 2. Finde Dimensionen die sowohl Radial (R/ZR) als auch Diagonal (-/B/D) haben
  const mixed = await prisma.$queryRaw`
    SELECT width, height, diameter, 
           array_agg(DISTINCT construction ORDER BY construction) as constructions,
           COUNT(*) as total
    FROM tire_catalog 
    WHERE vehicle_type = 'Motorrad' AND construction IS NOT NULL
    GROUP BY width, height, diameter
    HAVING COUNT(DISTINCT CASE WHEN construction IN ('R', 'ZR') THEN 'radial' WHEN construction IN ('-', 'B', 'D') THEN 'diagonal' END) > 1
    ORDER BY total DESC
    LIMIT 20
  `;
  console.log('\n=== DIMENSIONEN MIT SOWOHL RADIAL ALS AUCH DIAGONAL ===');
  console.log('Anzahl Dimensionen:', mixed.length);
  mixed.forEach(r => console.log(' ', r.width + '/' + r.height + ' R' + r.diameter, '→', r.constructions, '(' + r.total + ' Reifen)'));

  // 3. Für eine gemischte Dimension: zeige die einzelnen Reifen
  if (mixed.length > 0) {
    const sample = mixed[0];
    const tires = await prisma.tireCatalog.findMany({
      where: { vehicleType: 'Motorrad', width: sample.width, height: sample.height, diameter: sample.diameter },
      select: { brand: true, model: true, construction: true, ean: true },
      orderBy: { construction: 'asc' }
    });
    console.log('\n=== BEISPIEL:', sample.width + '/' + sample.height + ' R' + sample.diameter, '===');
    tires.forEach(t => console.log(' ', t.construction, '-', t.brand, t.model, '(EAN:', t.ean + ')'));
  }

  // 4. Teste Prisma-Filter: Radial-Filter schließt NULL aus?
  const testWidth = '120';
  const testHeight = '70';
  const testDia = '17';
  
  const radialCount = await prisma.tireCatalog.count({
    where: { vehicleType: 'Motorrad', width: testWidth, height: testHeight, diameter: testDia, construction: { in: ['R', 'ZR'] } }
  });
  const diagonalCount = await prisma.tireCatalog.count({
    where: { vehicleType: 'Motorrad', width: testWidth, height: testHeight, diameter: testDia, construction: { in: ['-', 'B', 'D'] } }
  });
  const nullInDim = await prisma.tireCatalog.count({
    where: { vehicleType: 'Motorrad', width: testWidth, height: testHeight, diameter: testDia, construction: null }
  });
  const totalInDim = await prisma.tireCatalog.count({
    where: { vehicleType: 'Motorrad', width: testWidth, height: testHeight, diameter: testDia }
  });
  
  console.log('\n=== FILTER-TEST für', testWidth + '/' + testHeight + ' R' + testDia, '===');
  console.log('Radial (R/ZR):', radialCount);
  console.log('Diagonal (-/B/D):', diagonalCount);
  console.log('NULL:', nullInDim);
  console.log('Gesamt:', totalInDim);
  console.log('Summe Rad+Dia+NULL:', radialCount + diagonalCount + nullInDim, '(sollte =', totalInDim, ')');

  await prisma.$disconnect();
})();
