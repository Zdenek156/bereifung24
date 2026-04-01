const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();

(async () => {
  const users = await p.user.findMany({
    where: { role: 'CUSTOMER' },
    select: { id: true, email: true, firstName: true, lastName: true }
  });
  
  let missing = 0;
  for (const u of users) {
    const c = await p.customer.findUnique({
      where: { userId: u.id },
      select: { id: true }
    });
    if (!c) {
      missing++;
      console.log('MISSING:', u.email, u.firstName, u.lastName, '| userId:', u.id);
    }
  }
  console.log('Total CUSTOMER users:', users.length, '| Missing:', missing);
  
  await p.$disconnect();
})();
