const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const result = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE tablename = 'weather_alerts'`;
    console.log('Table exists:', JSON.stringify(result));
    
    // Try to count records
    const count = await prisma.weatherAlert.count();
    console.log('Records in weather_alerts:', count);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
