const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      OR: [
        { make: 'BMW' },
        { make: 'Skoda' }
      ]
    },
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      summerTires: true,
      winterTires: true,
      customer: {
        select: {
          user: {
            select: {
              email: true
            }
          }
        }
      }
    }
  });
  
  console.log('Found vehicles:', vehicles.length);
  vehicles.forEach(v => {
    console.log('\n===================================');
    console.log('Vehicle:', v.make, v.model, v.year);
    console.log('Email:', v.customer?.user?.email);
    if (v.summerTires) {
      const parsed = JSON.parse(v.summerTires);
      console.log('Summer Tires:', JSON.stringify(parsed, null, 2));
    }
    if (v.winterTires) {
      const parsed = JSON.parse(v.winterTires);
      console.log('Winter Tires:', JSON.stringify(parsed, null, 2));
    }
  });
  
  await prisma.$disconnect();
})();
