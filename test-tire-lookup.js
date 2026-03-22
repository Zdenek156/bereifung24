const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  // Simulate what route.ts does
  const tireSize = '225/45 R17';
  const parts = tireSize.match(/(\d+)\/(\d+)\s*R(\d+)/);
  console.log('Regex parts:', parts);
  console.log('Types:', typeof parts[1], typeof parts[2], typeof parts[3]);
  
  const catalogTires = await p.tireCatalog.findMany({
    where: {
      width: parts[1],
      height: parts[2],
      diameter: parts[3],
      isActive: true,
    },
    orderBy: { brand: 'asc' },
    take: 5,
  });
  console.log('Found:', catalogTires.length, 'tires');
  for (const t of catalogTires) {
    console.log(`  ${t.brand} ${t.model} - ${t.width}/${t.height} R${t.diameter} | Grip:${t.labelWetGrip} Fuel:${t.labelFuelEfficiency} Noise:${t.labelNoise}dB`);
  }
  
  await p.$disconnect();
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
