const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
(async () => {
  const prisma = new PrismaClient();
  const hash = await bcrypt.hash('GoogleReview2026!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'review@bereifung24.de' },
    update: { password: hash, firstName: 'Google', lastName: 'Reviewer', emailVerified: true },
    create: {
      email: 'review@bereifung24.de',
      password: hash,
      firstName: 'Google',
      lastName: 'Reviewer',
      role: 'USER',
      emailVerified: true,
    },
  });
  console.log('Created:', user.id, user.email, user.role);
  await prisma.$disconnect();
})();
