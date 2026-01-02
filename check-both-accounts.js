require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBothAccounts() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'zdenek156@gmail.com' },
      select: { id: true, email: true, role: true, firstName: true }
    });
    
    const influencer = await prisma.influencer.findFirst({
      where: { email: 'zdenek156@gmail.com' },
      select: { id: true, email: true, code: true, channelName: true }
    });
    
    console.log('=== ACCOUNT CHECK ===');
    console.log('\nUser Account:', user ? JSON.stringify(user, null, 2) : 'NOT FOUND');
    console.log('\nInfluencer Account:', influencer ? JSON.stringify(influencer, null, 2) : 'NOT FOUND');
    
    if (user && influencer) {
      console.log('\n⚠️  BOTH ACCOUNTS EXIST WITH SAME EMAIL');
      console.log('This could cause authentication conflicts.');
      console.log('\nUser ID:', user.id);
      console.log('Influencer ID:', influencer.id);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBothAccounts();
