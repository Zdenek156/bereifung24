const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  // Count total tires
  const count = await p.tireCatalog.count();
  console.log('Total tires in catalog:', count);
  
  // Check active tires
  const activeCount = await p.tireCatalog.count({ where: { isActive: true } });
  console.log('Active tires:', activeCount);
  
  // Get all vehicles for customer
  const vehicles = await p.vehicle.findMany({
    select: { id: true, make: true, model: true, year: true, summerTires: true, winterTires: true, allSeasonTires: true, customerId: true }
  });
  console.log('\nAll vehicles:', vehicles.length);
  
  for (const v of vehicles) {
    console.log(`\n--- ${v.make} ${v.model} (${v.year}) ---`);
    const specs = v.summerTires || v.winterTires || v.allSeasonTires;
    if (specs) {
      try {
        const parsed = typeof specs === 'string' ? JSON.parse(specs) : specs;
        console.log('Tire specs:', JSON.stringify(parsed));
        if (parsed.width && parsed.aspectRatio && parsed.diameter) {
          const size = `${parsed.width}/${parsed.aspectRatio} R${parsed.diameter}`;
          console.log('Size:', size);
          
          // Check catalog for this size
          const matching = await p.tireCatalog.findMany({
            where: { width: parsed.width, height: parsed.aspectRatio, diameter: parsed.diameter, isActive: true },
            take: 3,
            select: { brand: true, model: true, width: true, height: true, diameter: true, labelWetGrip: true, labelFuelEfficiency: true }
          });
          console.log('Matching tires in catalog:', matching.length);
          if (matching.length > 0) console.log('Examples:', JSON.stringify(matching, null, 2));
        }
      } catch (e) { console.log('Parse error:', e.message); }
    } else {
      console.log('No tire specs stored');
    }
  }
  
  // Show some sample sizes in catalog
  const sizes = await p.$queryRaw`SELECT DISTINCT width, height, diameter, COUNT(*) as cnt FROM tire_catalog WHERE is_active = true GROUP BY width, height, diameter ORDER BY cnt DESC LIMIT 10`;
  console.log('\nTop 10 tire sizes in catalog:');
  for (const s of sizes) {
    console.log(`  ${s.width}/${s.height} R${s.diameter}: ${s.cnt} tires`);
  }
  
  await p.$disconnect();
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
