require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setAdminRole() {
  try {
    const updated = await prisma.user.update({
      where: { email: 'zdenek156@gmail.com' },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        role: true
      }
    });
    
    console.log('✅ User updated to ADMIN:', JSON.stringify(updated, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setAdminRole();
