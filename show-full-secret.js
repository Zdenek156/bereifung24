const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showSecret() {
  const setting = await prisma.adminApiSetting.findUnique({
    where: { key: 'GOCARDLESS_WEBHOOK_SECRET' }
  });
  console.log('Full secret:');
  console.log(setting.value);
  console.log('\nLength:', setting.value.length);
  await prisma.$disconnect();
}

showSecret();
