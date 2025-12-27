const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enableWeather() {
  try {
    const customer = await prisma.customer.findFirst({
      where: { user: { email: 'zdenek156@gmail.com' } }
    });
    
    if (!customer) {
      console.log('Customer not found');
      return;
    }

    const updated = await prisma.weatherAlert.update({
      where: { customerId: customer.id },
      data: {
        isEnabled: true,
        showOnDashboard: true
      }
    });
    
    console.log('✅ Weather alert enabled!');
    console.log('Settings:', JSON.stringify(updated, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

enableWeather();
