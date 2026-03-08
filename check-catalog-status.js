const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const total = await prisma.tireCatalog.count();
  console.log('Gesamt Reifen:', total);
  
  const byVehicle = await prisma.tireCatalog.groupBy({
    by: ['vehicleType'],
    _count: true
  });
  console.log('\nNach Fahrzeugtyp:');
  byVehicle.forEach(r => console.log(' ', r.vehicleType, ':', r._count));

  // Check if vehicleType might be stored differently
  const sample = await prisma.tireCatalog.findMany({
    select: { vehicleType: true, brand: true, model: true, construction: true },
    take: 5
  });
  console.log('\nStichprobe (5 Reifen):');
  sample.forEach(t => console.log(' ', t.vehicleType, '-', t.brand, t.model, '- Bauart:', t.construction));

  // Check for Motorrad specifically
  const motoVariants = await prisma.$queryRaw`
    SELECT DISTINCT vehicle_type FROM tire_catalog WHERE vehicle_type ILIKE '%motor%' OR vehicle_type ILIKE '%moto%' OR vehicle_type ILIKE '%bike%'
  `;
  console.log('\nMotorrad-Varianten:', motoVariants);
  
  await prisma.$disconnect();
})();
