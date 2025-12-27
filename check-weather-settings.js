const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    // Get customer ID from user
    const customer = await prisma.customer.findFirst({
      where: { user: { email: 'zdenek156@gmail.com' } },
      include: { weatherAlert: true }
    });
    
    console.log('Customer found:', !!customer);
    if (customer) {
      console.log('Weather Alert:', JSON.stringify(customer.weatherAlert, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
