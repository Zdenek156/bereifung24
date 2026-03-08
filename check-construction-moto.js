const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  // 1. Bauart-Verteilung für MOTO
  const dist = await prisma.$queryRaw`
    SELECT construction, COUNT(*)::int as cnt 
    FROM tire_catalog 
    WHERE vehicle_type = 'MOTO' 
    GROUP BY construction 
    ORDER BY cnt DESC
  `;
  console.log('=== BAUART VERTEILUNG (MOTO) ===');
  dist.forEach(r => console.log(' ', r.construction === null ? 'NULL' : JSON.stringify(r.construction), ':', r.cnt));

  // 2. Dimensionen die sowohl Radial (R/ZR) als auch Diagonal (-/B/D) haben
  const mixed = await prisma.$queryRaw`
    SELECT width, height, diameter,
      array_agg(DISTINCT construction ORDER BY construction) as types,
      COUNT(*)::int as total
    FROM tire_catalog
    WHERE vehicle_type = 'MOTO' AND construction IS NOT NULL
    GROUP BY width, height, diameter
    HAVING COUNT(DISTINCT CASE 
      WHEN construction IN ('R', 'ZR') THEN 'radial' 
      WHEN construction IN ('-', 'B', 'D') THEN 'diagonal' 
    END) > 1
    ORDER BY total DESC
    LIMIT 20
  `;
  console.log('\n=== DIMENSIONEN MIT SOWOHL RADIAL ALS AUCH DIAGONAL ===');
  console.log('Anzahl:', mixed.length);
  mixed.forEach(r => console.log(' ', r.width + '/' + r.height + ' R' + r.diameter, '→ Typen:', r.types, '(' + r.total + ' Reifen)'));

  // 3. Stichprobe einer gemischten Dimension
  if (mixed.length > 0) {
    const s = mixed[0];
    const tires = await prisma.tireCatalog.findMany({
      where: { vehicleType: 'MOTO', width: s.width, height: s.height, diameter: s.diameter },
      select: { brand: true, model: true, construction: true, ean: true, stock: true },
      orderBy: [{ construction: 'asc' }, { brand: 'asc' }],
      take: 30
    });
    console.log('\n=== BEISPIEL:', s.width + '/' + s.height + ' R' + s.diameter, '===');
    tires.forEach(t => console.log('  [' + (t.construction || 'NULL') + ']', t.brand, t.model, '(Stock:', t.stock + ')'));
  }

  // 4. NULL Bauart Reifen
  const nullTires = await prisma.tireCatalog.findMany({
    where: { vehicleType: 'MOTO', construction: null },
    select: { brand: true, model: true, width: true, height: true, diameter: true },
    take: 10
  });
  console.log('\n=== REIFEN OHNE BAUART (NULL) ===');
  console.log('Anzahl:', nullTires.length);
  nullTires.forEach(t => console.log(' ', t.brand, t.model, t.width + '/' + t.height + ' R' + t.diameter));

  await prisma.$disconnect();
})();
