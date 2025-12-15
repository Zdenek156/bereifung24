const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  // Get the most recent tire options with montage_price
  const options = await prisma.tireOption.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      brand: true,
      model: true,
      pricePerTire: true,
      montagePrice: true,
      carTireType: true,
      offer: {
        select: {
          id: true,
          tireRequestId: true
        }
      }
    }
  });
  
  console.log('Recent tire options:');
  options.forEach(opt => {
    console.log({
      id: opt.id,
      brand: opt.brand,
      model: opt.model,
      pricePerTire: opt.pricePerTire,
      montagePrice: opt.montagePrice,
      carTireType: opt.carTireType,
      requestId: opt.offer.tireRequestId
    });
  });
  
  await prisma.$disconnect();
})();
