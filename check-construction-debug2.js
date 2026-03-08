const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  // Bauart-Verteilung
  const dist = await prisma.$queryRaw`SELECT construction, COUNT(*)::int as cnt FROM tire_catalog WHERE vehicle_type = 'Motorrad' GROUP BY construction ORDER BY cnt DESC`;
  console.log('=== BAUART VERTEILUNG ===');
  dist.forEach(r => console.log(r.construction === null ? 'NULL' : JSON.stringify(r.construction), ':', r.cnt));
  
  const total = await prisma.tireCatalog.count({ where: { vehicleType: 'Motorrad' }});
  console.log('Total MOTO:', total);

  // Top Dimensionen
  const dims = await prisma.$queryRaw`SELECT width, height, diameter, COUNT(*)::int as cnt FROM tire_catalog WHERE vehicle_type = 'Motorrad' GROUP BY width, height, diameter ORDER BY cnt DESC LIMIT 10`;
  console.log('\nTOP 10 Dimensionen:');
  dims.forEach(r => console.log(r.width + '/' + r.height + ' R' + r.diameter, ':', r.cnt, 'Reifen'));

  // Gibt es Dimensionen die sowohl R/ZR als auch -/B/D haben?
  const mixed = await prisma.$queryRaw`
    SELECT width, height, diameter,
      COUNT(DISTINCT CASE WHEN construction IN ('R', 'ZR') THEN 'radial' END) as has_radial,
      COUNT(DISTINCT CASE WHEN construction IN ('-', 'B', 'D') THEN 'diagonal' END) as has_diagonal,
      array_agg(DISTINCT construction) as types,
      COUNT(*)::int as total
    FROM tire_catalog
    WHERE vehicle_type = 'Motorrad'
    GROUP BY width, height, diameter
    HAVING COUNT(DISTINCT CASE WHEN construction IN ('R', 'ZR') THEN 'radial' WHEN construction IN ('-', 'B', 'D') THEN 'diagonal' END) > 1
    ORDER BY total DESC
    LIMIT 20
  `;
  console.log('\n=== DIMENSIONEN MIT RADIAL + DIAGONAL ===');
  console.log('Anzahl:', mixed.length);
  mixed.forEach(r => console.log(r.width + '/' + r.height + ' R' + r.diameter, '→ Typen:', r.types, '(Gesamt:', r.total + ')'));

  // Stichprobe: erste gemischte Dimension
  if (mixed.length > 0) {
    const s = mixed[0];
    const tires = await prisma.tireCatalog.findMany({
      where: { vehicleType: 'Motorrad', width: s.width, height: s.height, diameter: s.diameter },
      select: { brand: true, model: true, construction: true },
      orderBy: { construction: 'asc' }
    });
    console.log('\nBeispiel ' + s.width + '/' + s.height + ' R' + s.diameter + ':');
    tires.forEach(t => console.log('  [' + (t.construction || 'NULL') + ']', t.brand, t.model));
  }

  await prisma.$disconnect();
})();
