const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();

(async () => {
  // Check all users and their roles + customer record status
  const users = await p.user.findMany({
    select: { id: true, email: true, firstName: true, role: true }
  });
  
  for (const u of users) {
    const c = await p.customer.findUnique({
      where: { userId: u.id },
      select: { id: true }
    });
    if (u.role !== 'CUSTOMER' || !c) {
      console.log(u.role, '|', u.email, '|', u.firstName, '| customer:', c ? c.id : 'NONE');
    }
  }
  
  await p.$disconnect();
})();
