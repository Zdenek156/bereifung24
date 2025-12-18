const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.findMany({
      take: 10,
      select: { id: true, email: true, role: true }
    });
    
    console.log('Erste 10 Users:');
    users.forEach(u => console.log(u.role, u.email, u.id.substring(0,8)));
    
    const customers = await prisma.customer.findMany({
      take: 10,
      include: { user: { select: { email: true } } }
    });
    
    console.log('\nErste 10 Customers:');
    customers.forEach(c => console.log(c.id.substring(0,8), c.user?.email || 'no user'));
    
    const requests = await prisma.tireRequest.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, customerId: true }
    });
    
    console.log('\nLetzte 10 TireRequests:');
    requests.forEach(r => console.log(r.status, r.id.substring(0,8), r.customerId.substring(0,8)));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
