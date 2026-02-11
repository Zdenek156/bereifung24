const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWorkshops() {
  try {
    const workshops = await prisma.workshop.findMany({
      where: {
        user: {
          email: 'luxus24.me@gmail.com'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    console.log('Found', workshops.length, 'workshops for luxus24.me@gmail.com:');
    for (const w of workshops) {
      console.log('---');
      console.log('Workshop ID:', w.id);
      console.log('User ID:', w.userId);
      console.log('Company:', w.companyName);
      console.log('User Email:', w.user.email);
      console.log('Created:', w.createdAt);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkshops();
