const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.workshop.findMany({ select: { id: true, name: true, logo: true } })
  .then(w => {
    w.forEach(x => console.log(x.id, '|', x.name, '|', x.logo));
    p.$disconnect();
  });
