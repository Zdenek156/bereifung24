const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allWs = await prisma.workshop.findMany({ select: { id: true, companyName: true } });
  for (const ws of allWs) {
    console.log('\n\n========== Workshop:', ws.companyName, '==========');
  console.log('Workshop:', ws.companyName);
  
  const services = await prisma.workshopService.findMany({
    where: { workshopId: ws.id, isActive: true },
    include: { 
      servicePackages: { 
        where: { isActive: true }, 
        orderBy: { price: 'asc' } 
      } 
    }
  });
  
  services.forEach(s => {
    console.log('\n===', s.serviceType, '===');
    console.log('  basePrice:', s.basePrice, '| basePrice4:', s.basePrice4);
    s.servicePackages.forEach(pkg => {
      console.log('  PKG:', pkg.packageType, '|', pkg.name, '|', pkg.price, 'EUR |', pkg.durationMinutes, 'min');
    });
    if (s.servicePackages.length === 0) {
      console.log('  (keine Pakete)');
    }
  });
  } // end for
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
