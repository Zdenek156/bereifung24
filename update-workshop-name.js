const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateName() {
  const workshop = await prisma.workshop.findFirst({
    where: { user: { email: 'bikeanzeigen@gmail.com' } }
  });
  
  const updated = await prisma.workshop.update({
    where: { id: workshop.id },
    data: { companyName: 'Müller Reifenservice' }
  });
  
  console.log('✅ Name geändert:', updated.companyName);
  await prisma.$disconnect();
}

updateName();
