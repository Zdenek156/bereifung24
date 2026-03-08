const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  // Find all workshops with MOTORCYCLE_TIRE service
  const ws = await p.workshop.findMany({
    where: { workshopServices: { some: { serviceType: 'MOTORCYCLE_TIRE', isActive: true } } },
    select: { 
      id: true, companyName: true, isVerified: true, latitude: true, longitude: true,
      workshopServices: { 
        where: { serviceType: 'MOTORCYCLE_TIRE' }, 
        select: { 
          id: true, isActive: true, serviceType: true, 
          servicePackages: { select: { packageType: true, price: true, isActive: true } } 
        } 
      }
    }
  });
  console.log('=== Workshops with MOTORCYCLE_TIRE ===');
  ws.forEach(w => {
    console.log(`\n${w.companyName} (${w.id}) isVerified=${w.isVerified}`);
    console.log('  Lat:', w.latitude, 'Lon:', w.longitude);
    w.workshopServices.forEach(s => {
      console.log('  Service:', s.serviceType, 'active:', s.isActive);
      s.servicePackages.forEach(pkg => {
        console.log('    Package:', pkg.packageType, 'Price:', pkg.price, 'active:', pkg.isActive);
      });
    });
  });

  // Also check what Luxus24 has in general
  const luxus = await p.workshop.findFirst({
    where: { companyName: { contains: 'Luxus' } },
    select: { 
      id: true, companyName: true, isVerified: true,
      workshopServices: { 
        select: { serviceType: true, isActive: true } 
      }
    }
  });
  
  if (luxus) {
    console.log('\n=== Luxus24 all services ===');
    console.log(luxus.companyName, luxus.id);
    luxus.workshopServices.forEach(s => {
      console.log('  ', s.serviceType, 'active:', s.isActive);
    });
  } else {
    console.log('\n❌ No workshop found with "Luxus" in name');
  }

  // Check tire catalog entries per workshop
  const catalogCounts = await p.$queryRaw`
    SELECT "workshopId", COUNT(*) as count 
    FROM "TireCatalog" 
    GROUP BY "workshopId"
  `;
  console.log('\n=== Tire catalog entries per workshop ===');
  console.log(catalogCounts);

  // Check supplier configs
  const suppliers = await p.supplierConfig.findMany({
    select: { id: true, name: true, workshopId: true, isActive: true }
  });
  console.log('\n=== Supplier configs ===');
  suppliers.forEach(s => {
    console.log(`  ${s.name} -> workshopId: ${s.workshopId}, active: ${s.isActive}`);
  });

  await p.$disconnect();
})();
