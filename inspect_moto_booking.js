const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.directBooking.findMany({
  where: { serviceType: 'MOTORCYCLE_TIRE' },
  orderBy: { createdAt: 'desc' },
  take: 3,
  select: {
    id: true,
    createdAt: true,
    serviceType: true,
    tireBrand: true,
    tireModel: true,
    tireSize: true,
    tireQuantity: true,
    tireData: true,
    totalPrice: true,
  },
}).then(b => { console.log(JSON.stringify(b, null, 2)); process.exit(0); });
