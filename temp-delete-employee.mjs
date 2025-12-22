import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const email = 'zdenek.kyzlink@bereifung24.de';

try {
  const result = await prisma.b24Employee.delete({
    where: { email }
  });
  console.log('✓ Employee deleted:', result.email);
} catch (error) {
  console.error('✗ Error:', error.message);
}

await prisma.$disconnect();
