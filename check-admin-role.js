require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'zdenek156@gmail.com' },
      select: {
        id: true,
        email: true,
        role: true
      }
    });
    
    console.log('User in database:', JSON.stringify(user, null, 2));
    
    if (!user) {
      console.log('❌ User not found!');
    } else if (user.role !== 'ADMIN') {
      console.log(`❌ User role is ${user.role}, not ADMIN`);
    } else {
      console.log('✅ User has ADMIN role');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
