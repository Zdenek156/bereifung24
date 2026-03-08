const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.workshop.findMany({ select: { id: true, companyName: true, logoUrl: true } })
  .then(w => {
    w.forEach(x => console.log(x.id, '|', x.companyName, '|', x.logoUrl || 'NO LOGO'));
    p.$disconnect();
  });
