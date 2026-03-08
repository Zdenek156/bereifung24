const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const luxusId = 'cml3g7rxd000ckeyn9ypqgg65';
  const mullerId = 'cmi9c1qzn000110hd0838ppwx';

  // Check WorkshopSupplier for both workshops
  const suppliers = await p.workshopSupplier.findMany({
    where: { workshopId: { in: [luxusId, mullerId] } },
    select: { workshopId: true, supplier: true, connectionType: true, isActive: true, autoOrder: true, priority: true }
  });
  
  console.log('=== WorkshopSupplier records ===');
  suppliers.forEach(s => {
    const name = s.workshopId === luxusId ? 'Luxus24' : 'Müller';
    console.log(`${name}: supplier=${s.supplier}, type=${s.connectionType}, active=${s.isActive}, autoOrder=${s.autoOrder}, priority=${s.priority}`);
  });

  if (!suppliers.find(s => s.workshopId === luxusId)) {
    console.log('\n❌ Luxus24 has NO WorkshopSupplier record!');
  }
  if (!suppliers.find(s => s.workshopId === mullerId)) {
    console.log('\n❌ Müller has NO WorkshopSupplier record!');
  }

  // Check PricingSettings
  const pricing = await p.pricingSettings.findMany({
    where: { workshopId: { in: [luxusId, mullerId] } },
    select: { workshopId: true, motoFixedMarkup: true, motoPercentMarkup: true, motoIncludeVat: true }
  });
  console.log('\n=== PricingSettings (Moto) ===');
  pricing.forEach(pr => {
    const name = pr.workshopId === luxusId ? 'Luxus24' : 'Müller';
    console.log(`${name}: fixedMarkup=${pr.motoFixedMarkup}, percentMarkup=${pr.motoPercentMarkup}, includeVat=${pr.motoIncludeVat}`);
  });

  if (!pricing.find(p => p.workshopId === luxusId)) {
    console.log('❌ Luxus24 has NO PricingSettings!');
  }

  // Check all WorkshopSupplier records in system
  const allSuppliers = await p.workshopSupplier.findMany({
    select: { workshopId: true, supplier: true, connectionType: true, isActive: true }
  });
  console.log('\n=== All WorkshopSupplier records ===');
  allSuppliers.forEach(s => console.log(`  workshopId=${s.workshopId}, supplier=${s.supplier}, type=${s.connectionType}, active=${s.isActive}`));

  await p.$disconnect();
})();
