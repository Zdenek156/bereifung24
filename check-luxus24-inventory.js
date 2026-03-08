const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const luxusId = 'cml3g7rxd000ckeyn9ypqgg65';
  const mullerId = 'cmi9c1qzn000110hd0838ppwx';

  // Count inventory for Luxus24
  const total = await p.workshopInventory.count({ where: { workshopId: luxusId } });
  console.log('Luxus24 total inventory:', total);

  // Count motorcycle dimensions
  const motoFront = await p.workshopInventory.count({ where: { workshopId: luxusId, width: '120', height: '70', diameter: '17' } });
  console.log('Luxus24 120/70 R17:', motoFront);

  const motoRear = await p.workshopInventory.count({ where: { workshopId: luxusId, width: '180', height: '55', diameter: '17' } });
  console.log('Luxus24 180/55 R17:', motoRear);

  // Check some motorcyle tires for Luxus24
  const motoTires = await p.workshopInventory.findMany({
    where: { workshopId: luxusId, vehicleType: 'MOTO' },
    take: 5,
    select: { width: true, height: true, diameter: true, brand: true, stock: true, vehicleType: true }
  });
  console.log('Luxus24 Moto tires sample:', JSON.stringify(motoTires, null, 2));

  // Count all Luxus24 vehicle types
  const vehicleTypes = await p.workshopInventory.groupBy({
    by: ['vehicleType'],
    where: { workshopId: luxusId },
    _count: { id: true }
  });
  console.log('\nLuxus24 Vehicle Types:', JSON.stringify(vehicleTypes, null, 2));

  // Check Müller comparison
  const mullerTotal = await p.workshopInventory.count({ where: { workshopId: mullerId } });
  console.log('\nMüller total inventory:', mullerTotal);

  const mullerMotoFront = await p.workshopInventory.count({ where: { workshopId: mullerId, width: '120', height: '70', diameter: '17' } });
  console.log('Müller 120/70 R17:', mullerMotoFront);

  const mullerMotoRear = await p.workshopInventory.count({ where: { workshopId: mullerId, width: '180', height: '55', diameter: '17' } });
  console.log('Müller 180/55 R17:', mullerMotoRear);

  const mullerVehicleTypes = await p.workshopInventory.groupBy({
    by: ['vehicleType'],
    where: { workshopId: mullerId },
    _count: { id: true }
  });
  console.log('Müller Vehicle Types:', JSON.stringify(mullerVehicleTypes, null, 2));

  await p.$disconnect();
})();
