const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const offers = await prisma.offer.findMany({ 
    orderBy: { createdAt: 'desc' }, 
    take: 1, 
    include: { tireOptions: true } 
  });
  console.log(JSON.stringify(offers, null, 2));
  await prisma.$disconnect();
})();
