const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const luxusId = 'cml3g7rxd000ckeyn9ypqgg65';

  // Simulate exactly what searchTiresViaDatabase does
  console.log('=== Simulating tire search for Luxus24 ===');

  // 1. Check WorkshopSupplier
  const supplier = await p.workshopSupplier.findFirst({
    where: { workshopId: luxusId, isActive: true },
    orderBy: { priority: 'asc' }
  });
  console.log('Supplier:', supplier ? `${supplier.supplier} (${supplier.connectionType})` : 'NONE');

  // 2. Check if tires exist with minStock >= 1
  const frontTires = await p.workshopInventory.findMany({
    where: {
      workshopId: luxusId,
      width: '120',
      height: '70',
      diameter: '17',
      stock: { gte: 1 }
    },
    take: 3,
    orderBy: { price: 'asc' },
    select: { id: true, brand: true, model: true, price: true, stock: true, vehicleType: true, construction: true }
  });
  console.log('\nFront tires (120/70 R17, stock>=1):', frontTires.length, 'found');
  frontTires.forEach(t => console.log(`  ${t.brand} ${t.model} - Price: ${t.price}, Stock: ${t.stock}, VehicleType: ${t.vehicleType}, Construction: ${t.construction}`));

  const rearTires = await p.workshopInventory.findMany({
    where: {
      workshopId: luxusId,
      width: '180',
      height: '55',
      diameter: '17',
      stock: { gte: 1 }
    },
    take: 3,
    orderBy: { price: 'asc' },
    select: { id: true, brand: true, model: true, price: true, stock: true, vehicleType: true, construction: true }
  });
  console.log('\nRear tires (180/55 R17, stock>=1):', rearTires.length, 'found');
  rearTires.forEach(t => console.log(`  ${t.brand} ${t.model} - Price: ${t.price}, Stock: ${t.stock}, VehicleType: ${t.vehicleType}, Construction: ${t.construction}`));

  // 3. Check PricingSettings
  const pricing = await p.pricingSettings.findUnique({
    where: { workshopId: luxusId }
  });
  console.log('\nPricingSettings:', pricing ? 'EXISTS' : 'MISSING');
  if (pricing) {
    console.log('  motoFixedMarkup:', pricing.motoFixedMarkup);
    console.log('  motoPercentMarkup:', pricing.motoPercentMarkup);
    console.log('  motoIncludeVat:', pricing.motoIncludeVat);
    console.log('  autoFixedMarkup:', pricing.autoFixedMarkup);
    console.log('  autoPercentMarkup:', pricing.autoPercentMarkup);
    console.log('  autoIncludeVat:', pricing.autoIncludeVat);
  }

  // 4. Check TirePricingBySize for moto
  const motoSizePricing = await p.tirePricingBySize.findMany({
    where: { workshopId: luxusId, vehicleType: 'MOTO' }
  });
  console.log('\nTirePricingBySize (MOTO):', motoSizePricing.length, 'rules');
  motoSizePricing.forEach(r => console.log(`  Rim ${r.rimSize}: fixed=${r.fixedMarkup}, percent=${r.percentMarkup}, vat=${r.includeVat}`));

  // 5. Simulate calculateSellingPrice
  if (frontTires.length > 0) {
    const tire = frontTires[0];
    const vehicleType = tire.vehicleType || 'PKW';
    const rimSize = Math.floor(parseFloat('17'));
    console.log(`\n=== Simulate calculateSellingPrice ===`);
    console.log(`  tire.price: ${tire.price}, vehicleType: ${vehicleType}, rimSize: ${rimSize}`);
    
    // Check specific pricing rule
    const rule = await p.tirePricingBySize.findUnique({
      where: {
        workshopId_rimSize_vehicleType: {
          workshopId: luxusId,
          rimSize: rimSize,
          vehicleType: vehicleType === 'Motorrad' ? 'MOTO' : 'AUTO'
        }
      }
    });
    console.log('  Pricing rule:', rule ? JSON.stringify(rule) : 'NONE (will use PricingSettings)');
    
    // Calculate price
    const isMoto = vehicleType === 'Motorrad';
    const fixedMarkup = isMoto ? pricing?.motoFixedMarkup : pricing?.autoFixedMarkup;
    const percentMarkup = isMoto ? pricing?.motoPercentMarkup : pricing?.autoPercentMarkup;
    const includeVat = isMoto ? pricing?.motoIncludeVat : pricing?.autoIncludeVat;
    
    console.log(`  isMoto: ${isMoto}, fixedMarkup: ${fixedMarkup}, percentMarkup: ${percentMarkup}, includeVat: ${includeVat}`);
    
    let price = tire.price + (fixedMarkup || 0);
    price = price * (1 + (percentMarkup || 0) / 100);
    if (includeVat) price = price * 1.19;
    console.log(`  sellingPrice: ${price.toFixed(2)}`);
  }

  // 6. Check if model exclusion filter affects us
  const demoCount = await p.workshopInventory.count({
    where: {
      workshopId: luxusId,
      width: '120', height: '70', diameter: '17',
      stock: { gte: 1 },
      model: { contains: 'DEMO', mode: 'insensitive' }
    }
  });
  const dotCount = await p.workshopInventory.count({
    where: {
      workshopId: luxusId,
      width: '120', height: '70', diameter: '17',
      stock: { gte: 1 },
      model: { contains: 'DOT', mode: 'insensitive' }
    }
  });
  console.log(`\nModel exclusions (120/70 R17): DEMO=${demoCount}, DOT=${dotCount}`);
  console.log(`After exclusion: ${frontTires.length - demoCount - dotCount} remaining (approx)`);

  await p.$disconnect();
})();
